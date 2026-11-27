import { z } from "zod";
import { ApiClientError } from "./api-client";
import type { ClientSession } from "./types";

const sessionSchema = z.object({
  user: z.object({
    id: z.string(),
    email: z.string().email(),
    role: z.enum(["STUDENT", "INSTRUCTOR", "ADMIN"]),
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
    displayName: z.string().optional(),
  }),
});

export async function authRequest(
  action: string,
  body?: unknown,
): Promise<ClientSession | null> {
  const response = await fetch(`/api/auth/${action}`, {
    method: "POST",
    credentials: "same-origin",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (response.status === 204) {
    if (response.headers.get("x-logout-revocation") === "failed")
      throw new Error(
        "Đã đăng xuất trên trình duyệt này nhưng chưa thể thu hồi phiên ở máy chủ.",
      );
    return null;
  }
  const payload = await response.json();
  if (!response.ok)
    throw new ApiClientError(
      payload?.error?.message || "Không thể kiểm tra phiên đăng nhập",
      response.status,
      payload?.error?.code,
      undefined,
      undefined,
      payload,
    );
  return sessionSchema.parse(payload);
}
