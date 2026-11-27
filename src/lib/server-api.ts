import { cookies } from "next/headers";
import { authenticatedApiRequest, type ApiRequestOptions } from "./api-client";
import { ACCESS_COOKIE } from "./auth-server";

/** Call after requireUser in a Server Component. Never serialize the token. */
export async function serverApiRequest<TResponse, TBody = unknown>(
  path: string,
  options: Omit<ApiRequestOptions<TBody>, "accessToken"> = {},
) {
  const accessToken = (await cookies()).get(ACCESS_COOKIE)?.value;
  return authenticatedApiRequest<TResponse, TBody>(path, {
    ...options,
    accessToken,
  });
}
