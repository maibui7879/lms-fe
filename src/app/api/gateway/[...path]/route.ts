import { NextResponse, type NextRequest } from "next/server";
import {
  ACCESS_COOKIE,
  assertSessionDeployment,
  REFRESH_COOKIE,
  authError,
  clearSessionCookies,
  gatewayFetch,
  isSameOrigin,
  isRevoked,
  rotateSession,
  setSessionCookies,
} from "@/lib/auth-server";
import { buildApiUrl } from "@/lib/api-client";
import { BodyTooLarge, readBody } from "@/lib/request-body";

async function forward(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  if (!["GET", "HEAD"].includes(request.method) && !isSameOrigin(request))
    return authError(403, "FORBIDDEN", "Invalid request origin");
  const { path } = await params;
  let gatewayPath: string;
  try {
    gatewayPath = `/api/v1/${path.map(encodeURIComponent).join("/")}`;
    buildApiUrl(gatewayPath);
    if (
      /^\/api\/v1\/auth\/(login|refresh|logout|logout-all|google|github)(\/|$)/.test(
        gatewayPath,
      )
    )
      return authError(
        403,
        "FORBIDDEN",
        "Use the session authentication endpoints",
      );
  } catch {
    return authError(400, "INVALID_PATH", "Invalid Gateway path");
  }
  const headers = new Headers();
  for (const name of ["accept", "content-type", "idempotency-key"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  let access = request.cookies.get(ACCESS_COOKIE)?.value;
  if (access) headers.set("Authorization", `Bearer ${access}`);
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  let rotated: Awaited<ReturnType<typeof rotateSession>> = null;
  const finish = (response: NextResponse) => {
    if (isRevoked(refreshToken)) {
      const rejected = authError(401, "UNAUTHORIZED", "Session revoked");
      clearSessionCookies(rejected);
      return rejected;
    }
    if (rotated && response.status !== 401)
      setSessionCookies(response, rotated);
    if (response.status === 401) clearSessionCookies(response);
    return response;
  };
  try {
    assertSessionDeployment();
    if (isRevoked(refreshToken))
      return finish(authError(401, "UNAUTHORIZED", "Session revoked"));
    // Uploads larger than 2 MiB need a dedicated streaming/direct-upload route.
    const body = ["GET", "HEAD"].includes(request.method)
      ? undefined
      : ((await readBody(request, 2 * 1024 * 1024)).buffer as ArrayBuffer);
    const send = () =>
      gatewayFetch(gatewayPath + request.nextUrl.search, {
        method: request.method,
        headers,
        body,
      });
    let upstream = await send();
    if (upstream.status === 401 && refreshToken) {
      rotated = await rotateSession(refreshToken);
      if (rotated) {
        await upstream.body?.cancel();
        access = rotated.accessToken;
        headers.set("Authorization", `Bearer ${access}`);
        upstream = await send();
      }
    }
    if (upstream.status >= 300 && upstream.status < 400)
      return finish(
        authError(502, "INVALID_REDIRECT", "Unexpected Gateway redirect"),
      );
    const responseHeaders = new Headers({ "Cache-Control": "no-store" });
    for (const name of [
      "content-type",
      "content-disposition",
      "x-request-id",
    ]) {
      const value = upstream.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }
    const response = new NextResponse(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
    return finish(response);
  } catch (error) {
    if (error instanceof BodyTooLarge)
      return authError(413, "BODY_TOO_LARGE", "Request body too large");
    return finish(
      authError(503, "SERVICE_UNAVAILABLE", "Không thể kết nối API Gateway"),
    );
  }
}

export {
  forward as GET,
  forward as POST,
  forward as PUT,
  forward as PATCH,
  forward as DELETE,
};
