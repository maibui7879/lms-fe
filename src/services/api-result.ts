import type { ApiResponse } from "@/lib/types";

export async function unwrapApiResponse<T>(
  response: Promise<ApiResponse<T>>,
): Promise<T> {
  return (await response).data;
}
