import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { REFRESH_COOKIE, safeReturnPath, serverUser } from "./auth-server";
import type { UserRole } from "./types";

export async function requireUser(path: string, roles?: readonly UserRole[]) {
  const result = await serverUser();
  if (!result.user) {
    if (result.status !== 401 && result.status !== 403)
      throw new Error("Không thể xác minh phiên đăng nhập. Vui lòng thử lại.");
    const next = encodeURIComponent(safeReturnPath(path));
    if (result.status === 401 && (await cookies()).has(REFRESH_COOKIE))
      redirect(`/auth/restore?next=${next}`);
    redirect(`/login?next=${next}`);
  }
  if (roles && !roles.includes(result.user.role)) redirect("/dashboard");
  return result.user;
}
