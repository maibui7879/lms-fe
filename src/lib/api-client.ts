export type QueryValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | readonly (string | number | boolean)[];

export type ApiMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
export type ApiResponseType = "json" | "text" | "blob";

export interface ApiRequestOptions<TBody = unknown> {
  method?: ApiMethod;
  query?: object;
  body?: TBody;
  accessToken?: string;
  idempotencyKey?: string;
  headers?: HeadersInit;
  signal?: AbortSignal;
  cache?: RequestCache;
  responseType?: ApiResponseType;
}

type ErrorRecord = {
  code?: string;
  message?: string | string[];
  details?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isQueryValue(value: unknown): value is QueryValue {
  if (
    value === null ||
    value === undefined ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return true;
  }

  return (
    Array.isArray(value) &&
    value.every(
      (item: unknown) =>
        typeof item === "string" ||
        typeof item === "number" ||
        typeof item === "boolean",
    )
  );
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function getApiBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "") ||
    "http://localhost:3000"
  );
}

export function buildApiUrl(
  path: string,
  query?: object,
): URL {
  let decodedPath: string;
  try {
    decodedPath = decodeURIComponent(path);
  } catch {
    throw new Error("Invalid URL encoding in Gateway route");
  }

  if (
    !path.startsWith("/api/v1/") ||
    path.includes("?") ||
    path.includes("#") ||
    /\/internal(?:\/|$)/i.test(decodedPath) ||
    /[?#\\\s]/.test(decodedPath) ||
    decodedPath.includes("..") ||
    decodedPath.split("/").some((segment) => segment === ".") ||
    /%(?:2f|5c|25)/i.test(path)
  ) {
    throw new Error("Only public /api/v1 Gateway routes can be requested");
  }

  const url = new URL(path, `${getApiBaseUrl()}/`);
  for (const [key, value] of Object.entries(query ?? {}) as [string, unknown][]) {
    if (!isQueryValue(value)) {
      throw new TypeError(`Invalid query parameter: ${key}`);
    }
    if (value === undefined || value === null) continue;

    const values: unknown[] = Array.isArray(value) ? value : [value];
    for (const item of values) {
      if (
        typeof item !== "string" &&
        typeof item !== "number" &&
        typeof item !== "boolean"
      ) {
        throw new TypeError(`Invalid query parameter: ${key}`);
      }
      url.searchParams.append(key, String(item));
    }
  }

  return url;
}

async function readResponseBody(
  response: Response,
  responseType: ApiResponseType,
): Promise<unknown> {
  if (response.status === 204) return undefined;
  if (responseType === "blob") return response.blob();

  const text = await response.text();
  if (!text) return undefined;
  if (responseType === "text") return text;

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("json")) return JSON.parse(text) as unknown;
  return text;
}

function errorRecord(payload: unknown): ErrorRecord {
  if (!isRecord(payload)) return {};

  const nestedError = payload.error;
  if (isRecord(nestedError)) {
    return {
      code: typeof nestedError.code === "string" ? nestedError.code : undefined,
      message:
        typeof nestedError.message === "string"
          ? nestedError.message
          : isStringArray(nestedError.message)
            ? nestedError.message
            : undefined,
      details: nestedError.details,
    };
  }

  return {
    code: typeof payload.code === "string" ? payload.code : undefined,
    message:
      typeof payload.message === "string"
        ? payload.message
        : isStringArray(payload.message)
          ? payload.message
          : undefined,
  };
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string | undefined,
    readonly requestId: string | undefined,
    readonly details: unknown,
    readonly payload: unknown,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

export async function apiRequest<TResponse = unknown, TBody = unknown>(
  path: string,
  options: ApiRequestOptions<TBody> = {},
): Promise<TResponse> {
  const url = buildApiUrl(path, options.query);
  const headers = new Headers(options.headers);
  const responseType = options.responseType ?? "json";

  if (!headers.has("Accept")) {
    headers.set("Accept", responseType === "blob" ? "*/*" : "application/json");
  }
  if (options.accessToken) {
    headers.set("Authorization", `Bearer ${options.accessToken}`);
  }
  if (options.idempotencyKey) {
    headers.set("Idempotency-Key", options.idempotencyKey);
  }

  let body: string | undefined;
  if (options.body !== undefined) {
    body = JSON.stringify(options.body);
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
  }

  const response = await fetch(url, {
    method: options.method ?? "GET",
    headers,
    body,
    signal: options.signal,
    cache: options.cache ?? "no-store",
  });
  const payload = await readResponseBody(
    response,
    response.ok ? responseType : "json",
  );

  if (!response.ok) {
    const error = errorRecord(payload);
    const message = Array.isArray(error.message)
      ? error.message.join(", ")
      : error.message;
    const meta = isRecord(payload) && isRecord(payload.meta) ? payload.meta : {};
    const payloadRequestId =
      isRecord(payload) && typeof payload.requestId === "string"
        ? payload.requestId
        : undefined;

    throw new ApiClientError(
      message ?? `Gateway request failed with status ${response.status}`,
      response.status,
      error.code,
      response.headers.get("x-request-id") ??
        (typeof meta.requestId === "string" ? meta.requestId : payloadRequestId),
      error.details,
      payload,
    );
  }

  return payload as TResponse;
}

export function authenticatedApiRequest<
  TResponse = unknown,
  TBody = unknown,
>(
  path: string,
  options: ApiRequestOptions<TBody> & { accessToken: string },
): Promise<TResponse> {
  if (!options.accessToken) {
    throw new ApiClientError(
      "An access token is required for this API request",
      401,
      "UNAUTHORIZED",
      undefined,
      undefined,
      undefined,
    );
  }

  return apiRequest<TResponse, TBody>(path, options);
}
