import { ForbiddenException, Injectable, type CanActivate, type ExecutionContext } from "@nestjs/common";
import type { Request } from "express";

/**
 * Check `request.jwtUser.role === "ADMIN"` — PHẢI đứng SAU `JwtAuthGuard` trong
 * `@UseGuards(JwtAuthGuard, AdminGuard)` (Nest chạy guard theo thứ tự khai báo),
 * vì guard này chỉ đọc `request.jwtUser`, không tự verify token.
 * Dùng cho route quản trị destinations/pois (D2) — route đọc công khai (D3) không gắn guard này.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    if (!request.jwtUser) {
      // JwtAuthGuard đã chặn trước; nếu tới đây là lỗi cấu hình (thiếu JwtAuthGuard).
      throw new Error("AdminGuard used without JwtAuthGuard");
    }
    if (request.jwtUser.role !== "ADMIN") {
      throw new ForbiddenException({ detail: "Admin role required" });
    }
    return true;
  }
}
