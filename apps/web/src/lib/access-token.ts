/**
 * Access token JWT giữ ngoài React (biến module-level) — `apiFetch` là hàm thường,
 * không phải hook, cần đọc/ghi token mà không phụ thuộc cây component nào đang mount.
 * Mất khi F5 (đúng chủ đích, an toàn hơn localStorage) — `api-client.ts` tự "silent
 * refresh" lại bằng refresh token (httpOnly cookie) ngay lần gọi API đầu tiên bị 401.
 */
let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}
