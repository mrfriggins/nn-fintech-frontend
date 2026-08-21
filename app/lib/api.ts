export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export class UnauthenticatedError extends Error {
  constructor() {
    super("No active session token");
    this.name = "UnauthenticatedError";
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("token");
}

export function clearToken(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem("token");
}

type ApiRequestInit = RequestInit & { auth?: boolean };

/**
 * Fetch wrapper for the backend API. Requires a session token by default and
 * discards it when the backend reports the session is no longer valid.
 */
export async function apiFetch(path: string, init: ApiRequestInit = {}): Promise<Response> {
  const { auth = true, headers, ...rest } = init;
  const requestHeaders = new Headers(headers);

  if (auth) {
    const token = getToken();
    if (!token) throw new UnauthenticatedError();
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_URL}${path}`, { ...rest, headers: requestHeaders });
  if (res.status === 401) clearToken();
  return res;
}

export async function apiJson(path: string, body: unknown, init: ApiRequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  return apiFetch(path, { ...init, method: init.method ?? "POST", headers, body: JSON.stringify(body) });
}

/** Loosely typed JSON payload returned by the backend API. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ApiJson = any;

/** Parses a JSON body without throwing on empty or malformed responses. */
export async function readJson<T = ApiJson>(res: Response): Promise<T | null> {
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}
