/**
 * Fetch wrapper gọi Nest qua same-origin `/api/v1/*` (rewrite).
 * Unwrap `{ data }` success; map problem+json → ApiError.
 * Tự gắn `Authorization: Bearer` (access token); gặp 401 tự refresh 1 lần rồi retry.
 */
import { getAccessToken, setAccessToken } from "./access-token";

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

// Nhiều request 401 cùng lúc (vd load trang gọi song song vài API) chỉ nên gọi
// /auth/refresh 1 lần — request sau tự "ăn theo" promise đang chạy thay vì tự gọi lại.
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await fetch("/api/v1/auth/refresh", { method: "POST", credentials: "include" });
        if (!res.ok) return null;
        const payload = (await parseJson(res)) as SuccessEnvelope<{ accessToken: string }> | null;
        const newToken = payload?.data.accessToken ?? null;
        setAccessToken(newToken);
        return newToken;
      } catch {
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

export async function apiFetch<T>(path: string, init?: RequestInit, isRetry = false): Promise<T> {
  const url = path.startsWith("/") ? `/api/v1${path}` : `/api/v1/${path}`;
  const token = getAccessToken();
  const res = await fetch(url, {
    ...init,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });

  // 401 lần đầu (chưa retry) — thử refresh access token 1 lần rồi gọi lại đúng
  // request gốc. Đây cũng là cơ chế "silent refresh lúc F5": ngay request /auth/me
  // đầu tiên (chưa có token trong bộ nhớ) sẽ tự đi qua nhánh này.
  if (res.status === 401 && !isRetry) {
    const refreshedToken = await refreshAccessToken();
    if (refreshedToken) {
      return apiFetch<T>(path, init, true);
    }
    // Refresh cũng thất bại (chưa từng login / hết hạn thật) — rơi xuống xử lý lỗi bình thường.
  }

  // 204 No Content (vd logout) — không có body.
  if (res.status === 204) {
    if (!res.ok) throw new ApiError(res.status, {});
    return undefined as T;
  }

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
