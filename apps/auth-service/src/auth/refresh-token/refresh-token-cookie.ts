import type { Response } from "express";
import type { ConfigService } from "../../config/config.service";
import { REFRESH_TOKEN_TTL_MS } from "./refresh-token.service";

/** Tên cookie refresh token — khác `tripmind.sid` (session cũ, đã bỏ ở task #6). */
export const REFRESH_TOKEN_COOKIE_NAME = "tripmind.rt";

/**
 * httpOnly: JS phía frontend không đọc được giá trị — chỉ browser tự gửi kèm request.
 * Đây là lý do chọn cookie thay vì localStorage cho refresh token (chống XSS đọc trộm).
 */
export function setRefreshTokenCookie(res: Response, token: string, configService: ConfigService): void {
  res.cookie(REFRESH_TOKEN_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: configService.isProduction,
    maxAge: REFRESH_TOKEN_TTL_MS,
  });
}

export function clearRefreshTokenCookie(res: Response): void {
  res.clearCookie(REFRESH_TOKEN_COOKIE_NAME);
}
