import { cookies } from "next/headers";
import { connection, NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import type { AuthUser } from "./types";

export const ACCESS_COOKIE = "lms_access";
export const REFRESH_COOKIE = "lms_refresh";
export const userSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  role: z.enum(["STUDENT", "INSTRUCTOR", "ADMIN"]),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  displayName: z.string().optional(),
});
export const tokenSessionSchema = z.object({
  accessToken: z.string().min(1).max(3800),
  refreshToken: z.string().min(1).max(3800),
  tokenType: z.literal("Bearer"),
  expiresIn: z.number().int().positive().max(604800),
  refreshExpiresAt: z.string().datetime(),
  user: userSchema,
});
export type TokenSession = z.infer<typeof tokenSessionSchema>;

export function authError(status: number, code: string, message: string) {
  return NextResponse.json(
    { error: { code, message } },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export function isSameOrigin(request: NextRequest): boolean {
  return (
    request.headers.get("origin") === request.nextUrl.origin &&
    request.headers.get("sec-fetch-site") !== "cross-site"
  );
}

export async function gatewayFetch(path: string, init: RequestInit = {}) {
  const base =
    process.env.API_GATEWAY_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:3000";
  return fetch(new URL(path, base), {
    ...init,
    cache: "no-store",
    redirect: "manual",
    signal: AbortSignal.timeout(10000),
  });
}

export function setSessionCookies(
  response: NextResponse,
  session: TokenSession,
) {
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };
  response.cookies.set(ACCESS_COOKIE, session.accessToken, {
    ...options,
    maxAge: session.expiresIn,
  });
  response.cookies.set(REFRESH_COOKIE, session.refreshToken, {
    ...options,
    expires: new Date(session.refreshExpiresAt),
  });
}

export function clearSessionCookies(response: NextResponse) {
  for (const name of [ACCESS_COOKIE, REFRESH_COOKIE])
    response.cookies.set(name, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
}

export async function readVerifiedUser(
  accessToken: string,
): Promise<{ user: AuthUser | null; status: number }> {
  const response = await gatewayFetch("/api/v1/users/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) return { user: null, status: response.status };
  const result = z
    .object({ data: userSchema })
    .safeParse(await response.json());
  if (!result.success) return { user: null, status: 502 };
  if (result.data.data.status === "INACTIVE")
    return { user: null, status: 403 };
  return { user: result.data.data, status: 200 };
}

// This coordinator requires one long-lived Node process. Fail closed when a
// production deployment has not explicitly acknowledged that constraint.
export function assertSessionDeployment() {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.AUTH_SESSION_MODE !== "single-instance"
  )
    throw new Error(
      "Configure a shared session coordinator before scaling auth",
    );
}

type RefreshEntry = {
  until: number;
  pending: Promise<TokenSession | null>;
  revoked: boolean;
};
// Route handlers may load separate bundles. Share coordination across bundles
// (and development reloads), not just imports of this module.
const processState = globalThis as typeof globalThis & {
  __lmsAuthCoordinator?: {
    refreshes: Map<string, RefreshEntry>;
    revoked: Map<string, number>;
  };
};
const { refreshes, revoked } = (processState.__lmsAuthCoordinator ??= {
  refreshes: new Map(),
  revoked: new Map(),
});
export function isRevoked(refreshToken?: string) {
  return !!refreshToken && (revoked.get(refreshToken) ?? 0) > Date.now();
}

export async function revokeSession(refreshToken: string) {
  assertSessionDeployment();
  // Retain a tombstone beyond the maximum accepted access lifetime (24 hours).
  // Backend revocation remains authoritative for refresh tokens.
  for (const [key, until] of revoked)
    if (until <= Date.now()) revoked.delete(key);
  const visited = new Set<string>();
  let current = refreshToken;
  while (!visited.has(current)) {
    visited.add(current);
    if (!revoked.has(current) && revoked.size >= 10000)
      throw new Error("Session revocation capacity exceeded");
    revoked.set(current, Date.now() + 2 * 86400000);
    const entry = refreshes.get(current);
    if (!entry) return current;
    entry.revoked = true;
    const session = await entry.pending.catch(() => null);
    if (!session) return current;
    current = session.refreshToken;
  }
  return current;
}
export async function rotateSession(
  refreshToken: string,
): Promise<TokenSession | null> {
  assertSessionDeployment();
  if (isRevoked(refreshToken)) return null;
  for (const [key, value] of refreshes)
    if (value.until < Date.now()) refreshes.delete(key);
  const existing = refreshes.get(refreshToken);
  if (existing) {
    const session = await existing.pending;
    return existing.revoked || isRevoked(session?.refreshToken)
      ? null
      : session;
  }
  if (refreshes.size >= 256) throw new Error("Refresh capacity exceeded");
  const pending = (async () => {
    const response = await gatewayFetch("/api/v1/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (response.status === 401 || response.status === 403) return null;
    if (!response.ok) throw new Error("Refresh provider unavailable");
    const result = z
      .object({ data: tokenSessionSchema })
      .safeParse(await response.json());
    if (
      !result.success ||
      result.data.data.user.status === "INACTIVE" ||
      Date.parse(result.data.data.refreshExpiresAt) <= Date.now()
    )
      return null;
    return result.data.data;
  })();
  const entry = { until: Infinity, pending, revoked: false };
  refreshes.set(refreshToken, entry);
  try {
    const session = await pending;
    entry.until = Date.now() + 5000;
    return entry.revoked || isRevoked(session?.refreshToken) ? null : session;
  } catch (error) {
    refreshes.delete(refreshToken);
    throw error;
  }
}

export async function serverUser() {
  await connection();
  const jar = await cookies();
  assertSessionDeployment();
  if (isRevoked(jar.get(REFRESH_COOKIE)?.value))
    return { user: null, status: 401 };
  const access = jar.get(ACCESS_COOKIE)?.value;
  return access ? readVerifiedUser(access) : { user: null, status: 401 };
}

export { safeReturnPath } from "./auth-path";
