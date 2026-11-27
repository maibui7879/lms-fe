import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import {
  ACCESS_COOKIE,
  assertSessionDeployment,
  REFRESH_COOKIE,
  authError,
  clearSessionCookies,
  gatewayFetch,
  isSameOrigin,
  isRevoked,
  readVerifiedUser,
  rotateSession,
  revokeSession,
  setSessionCookies,
  tokenSessionSchema,
} from "@/lib/auth-server";
import { BodyTooLarge, readBody } from "@/lib/request-body";

function clientSession(user: z.infer<typeof tokenSessionSchema>["user"]) {
  return NextResponse.json(
    { user },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ action: string }> },
) {
  if (!isSameOrigin(request))
    return authError(403, "FORBIDDEN", "Invalid request origin");
  const { action } = await params;
  if (!["login", "session", "refresh", "logout", "logout-all"].includes(action))
    return authError(404, "NOT_FOUND", "Unknown authentication action");
  try {
    assertSessionDeployment();
    if (action === "login") {
      const bytes = await readBody(request, 16 * 1024);
      const input = z
        .object({
          email: z.string().email(),
          password: z.string().min(1).max(128),
        })
        .strict()
        .safeParse(
          await Promise.resolve()
            .then(() => JSON.parse(new TextDecoder().decode(bytes)))
            .catch(() => null),
        );
      if (!input.success)
        return authError(
          400,
          "VALIDATION_ERROR",
          "Email hoặc mật khẩu không hợp lệ",
        );
      const upstream = await gatewayFetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input.data),
      });
      if (!upstream.ok)
        return authError(
          upstream.status >= 400 && upstream.status < 600
            ? upstream.status
            : 502,
          "LOGIN_FAILED",
          upstream.status === 401
            ? "Email hoặc mật khẩu không đúng"
            : upstream.status === 403
              ? "Tài khoản không được phép đăng nhập"
              : "Không thể đăng nhập. Vui lòng thử lại.",
        );
      const session = z
        .object({ data: tokenSessionSchema })
        .safeParse(await upstream.json());
      if (
        !session.success ||
        session.data.data.user.status === "INACTIVE" ||
        Date.parse(session.data.data.refreshExpiresAt) <= Date.now()
      )
        return authError(
          502,
          "INVALID_SESSION",
          "Phản hồi đăng nhập không hợp lệ",
        );
      const response = clientSession(session.data.data.user);
      setSessionCookies(response, session.data.data);
      return response;
    }

    const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
    const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
    if (action === "logout" || action === "logout-all") {
      const response = new NextResponse(null, {
        status: 204,
        headers: { "Cache-Control": "no-store" },
      });
      clearSessionCookies(response);
      try {
        if (action === "logout-all") {
          const revokeAll = (token: string) =>
            gatewayFetch("/api/v1/auth/logout-all", {
              method: "POST",
              headers: { Authorization: `Bearer ${token}` },
            });
          // Obtain a valid access token, then close refresh admission and wait
          // for any already-running rotation before revoking on Identity.
          const rotated = refreshToken
            ? await rotateSession(refreshToken)
            : null;
          if (refreshToken) await revokeSession(refreshToken);
          const token = rotated?.accessToken || accessToken;
          const upstream = token ? await revokeAll(token) : null;
          if ((accessToken || refreshToken) && !upstream?.ok)
            response.headers.set("X-Logout-Revocation", "failed");
        } else if (refreshToken) {
          const latest = await revokeSession(refreshToken);
          const upstream = await gatewayFetch("/api/v1/auth/logout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken: latest }),
          });
          if (!upstream.ok)
            response.headers.set("X-Logout-Revocation", "failed");
        }
      } catch {
        if (refreshToken) await revokeSession(refreshToken).catch(() => {});
        response.headers.set("X-Logout-Revocation", "failed");
      }
      return response;
    }

    if (isRevoked(refreshToken)) {
      const response = authError(401, "UNAUTHORIZED", "Session revoked");
      clearSessionCookies(response);
      return response;
    }

    if (action === "session" && accessToken) {
      const result = await readVerifiedUser(accessToken);
      if (result.user) return clientSession(result.user);
      if (result.status !== 401 && result.status !== 403)
        return authError(
          result.status,
          "SESSION_UNAVAILABLE",
          "Không thể kiểm tra phiên đăng nhập",
        );
      if (result.status === 403) {
        const response = authError(
          401,
          "UNAUTHORIZED",
          "Phiên đăng nhập không còn hợp lệ",
        );
        clearSessionCookies(response);
        return response;
      }
    }
    if (refreshToken) {
      const session = await rotateSession(refreshToken);
      if (session) {
        let verified;
        try {
          verified = await readVerifiedUser(session.accessToken);
        } catch {
          const response = authError(
            503,
            "SESSION_UNAVAILABLE",
            "Identity unavailable",
          );
          if (!isRevoked(refreshToken)) setSessionCookies(response, session);
          return response;
        }
        if (isRevoked(refreshToken))
          return authError(401, "UNAUTHORIZED", "Session revoked");
        if (verified.user) {
          const response = clientSession(verified.user);
          setSessionCookies(response, session);
          return response;
        }
        if (verified.status !== 401 && verified.status !== 403) {
          const response = authError(
            verified.status,
            "SESSION_UNAVAILABLE",
            "Không thể kiểm tra phiên đăng nhập",
          );
          setSessionCookies(response, session);
          return response;
        }
      }
    }
    const response = authError(401, "UNAUTHORIZED", "Vui lòng đăng nhập lại");
    clearSessionCookies(response);
    return response;
  } catch (error) {
    if (error instanceof BodyTooLarge)
      return authError(413, "BODY_TOO_LARGE", "Request body too large");
    return authError(
      503,
      "SERVICE_UNAVAILABLE",
      "Không thể kết nối dịch vụ tài khoản. Vui lòng thử lại.",
    );
  }
}
