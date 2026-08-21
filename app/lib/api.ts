export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export type ApiResult<T> = {
  ok: boolean;
  status: number;
  data: T | null;
  response: Response;
};

// Shared fallback keeps untyped call sites ergonomic while retaining one lint exception.
type ApiJson = any; // eslint-disable-line @typescript-eslint/no-explicit-any

export const getAuthHeaders = (includeJson = false): Record<string, string> => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    ...(includeJson ? { "Content-Type": "application/json" } : {}),
    Authorization: `Bearer ${token}`,
  };
};

const parseResponseBody = async <T>(response: Response): Promise<T | null> => {
  try {
    return await response.json() as T;
  } catch {
    return null;
  }
};

export const requestGet = async <T = ApiJson>(path: string): Promise<ApiResult<T>> => {
  const response = await fetch(`${API_URL}${path}`, {
    headers: getAuthHeaders(),
  });
  return {
    ok: response.ok,
    status: response.status,
    data: await parseResponseBody<T>(response),
    response,
  };
};

export const requestPostJson = async <T = ApiJson>(
  path: string,
  body?: unknown,
  options: { authenticated?: boolean } = {},
): Promise<ApiResult<T>> => {
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: options.authenticated === false
      ? { "Content-Type": "application/json" }
      : getAuthHeaders(true),
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  return {
    ok: response.ok,
    status: response.status,
    data: await parseResponseBody<T>(response),
    response,
  };
};
