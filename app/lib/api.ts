export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

type ApiErrorKind = "network" | "http" | "malformed";

/** Shape of a decoded JSON object from the backend. Fields stay `unknown` so
 * callers are forced to validate before use. */
export type ApiRecord = Record<string, unknown>;

/** Coerces an untrusted backend field into a finite number. */
export function toNumber(value: unknown, fallback = 0): number {
  const parsed = typeof value === "string" ? parseFloat(value) : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/** Coerces an untrusted backend field into a displayable string. */
export function toText(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
}

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number;
  readonly payload: unknown;

  constructor(
    message: string,
    kind: ApiErrorKind,
    status: number,
    payload: unknown,
    options?: { cause?: unknown }
  ) {
    super(message, options);
    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
    this.payload = payload;
  }

  get isUnauthorized() {
    return this.status === 401;
  }

  get isForbidden() {
    return this.status === 403;
  }

  get isPaymentRequired() {
    return (
      this.status === 402 ||
      (isRecord(this.payload) && this.payload.paymentRequired === true)
    );
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function authToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("token");
}

function buildHeaders(init: RequestInit, auth: boolean): HeadersInit {
  const headers = new Headers(init.headers);
  if (init.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (auth && !headers.has("Authorization")) {
    const token = authToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }
  return headers;
}

async function readBody(res: Response): Promise<unknown> {
  const raw = await res.text();
  if (raw.trim() === "") return null;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

function messageFromPayload(payload: unknown): string | null {
  if (typeof payload === "string" && payload.trim() !== "") return payload.trim();
  if (isRecord(payload)) {
    for (const key of ["error", "message", "detail"]) {
      const value = payload[key];
      if (typeof value === "string" && value.trim() !== "") return value.trim();
    }
  }
  return null;
}

/**
 * Performs a JSON request against the backend and either resolves with the
 * parsed body or rejects with an `ApiError` carrying the status and the
 * server-provided message. Never resolves for a failed request, so callers
 * cannot accidentally treat an error response as data.
 */
export async function apiFetch<T = unknown>(
  path: string,
  init: RequestInit & { auth?: boolean } = {}
): Promise<T> {
  const { auth = true, ...requestInit } = init;
  const url = /^https?:\/\//.test(path) ? path : `${API_URL}${path}`;

  let res: Response;
  try {
    res = await fetch(url, { ...requestInit, headers: buildHeaders(requestInit, auth) });
  } catch (cause) {
    throw new ApiError(
      "Network unreachable — the vault backend did not respond.",
      "network",
      0,
      null,
      { cause }
    );
  }

  const payload = await readBody(res);

  if (!res.ok) {
    throw new ApiError(
      messageFromPayload(payload) || `Request failed with status ${res.status}.`,
      "http",
      res.status,
      payload
    );
  }

  return payload as T;
}

/** Same as `apiFetch`, but rejects when the payload is not a JSON array. */
export async function apiFetchArray<T = unknown>(
  path: string,
  init: RequestInit & { auth?: boolean } = {}
): Promise<T[]> {
  const payload = await apiFetch<unknown>(path, init);
  if (!Array.isArray(payload)) {
    throw new ApiError(
      "Malformed response — expected a list from the backend.",
      "malformed",
      200,
      payload
    );
  }
  return payload as T[];
}

/** Extracts a user-presentable message from an unknown thrown value. */
export function errorMessage(err: unknown, fallback = "Unexpected error."): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error && err.message.trim() !== "") return err.message;
  return fallback;
}

/**
 * Logs an error that has no user-facing surface. Keeps the original error
 * attached so failures stay diagnosable instead of being swallowed.
 */
export function logError(context: string, err: unknown) {
  console.error(`[nn-fintech] ${context}`, err);
}
