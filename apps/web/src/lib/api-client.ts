/**
 * Fetch wrapper gọi Nest qua same-origin `/api/*` (rewrite).
 * Unwrap `{ data }` success; map problem+json → ApiError.
 */

export type ApiErrorBody = {
  detail?: string;
  category?: "business" | "system";
  errors?: Array<{ path: string; message: string }>;
  title?: string;
  status?: number;
};

export class ApiError extends Error {
  readonly status: number;
  readonly category: "business" | "system" | "unknown";
  readonly errors?: Array<{ path: string; message: string }>;

  constructor(status: number, body: ApiErrorBody) {
    super(body.detail ?? body.title ?? `Request failed (${status})`);
    this.name = "ApiError";
    this.status = status;
    this.category = body.category ?? "unknown";
    this.errors = body.errors;
  }
}

type SuccessEnvelope<T> = { data: T };

async function parseJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { detail: text };
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = path.startsWith("/") ? `/api${path}` : `/api/${path}`;
  const res = await fetch(url, {
    ...init,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  const payload = await parseJson(res);

  if (!res.ok) {
    throw new ApiError(res.status, (payload ?? {}) as ApiErrorBody);
  }

  // Health trả raw `{ status }` — không bọc data. Các endpoint khác bọc `{ data }`.
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as SuccessEnvelope<T>).data;
  }
  return payload as T;
}

export const api = {
  get: <T>(path: string) => apiFetch<T>(path),
  post: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: "PATCH", body: body === undefined ? undefined : JSON.stringify(body) }),
  delete: <T>(path: string) => apiFetch<T>(path, { method: "DELETE" }),
};
