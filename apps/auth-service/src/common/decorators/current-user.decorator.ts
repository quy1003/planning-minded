import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { UserRole } from "@tripmind/shared";
import type { Request } from "express";

/** Shape user trả về sau khi verify password / tra DB (không gồm passwordHash). */
export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
};

type RequestWithUser = Request & { user?: AuthUser };

/**
 * Lấy `req.user` — gán bởi Passport khi `LocalStrategy.validate()` chạy qua
 * `LocalAuthGuard` (chỉ dùng ở `/auth/login`). Route đã login rồi (JWT) dùng
 * `@CurrentUserId()` (đọc `req.jwtUser`, gán bởi `JwtAuthGuard`) thay vì decorator này.
 */
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): AuthUser => {
  const request = ctx.switchToHttp().getRequest<RequestWithUser>();
  if (!request.user) {
    // Guard đã chặn trước; nếu tới đây là lỗi cấu hình.
    throw new Error("CurrentUser used without authenticated user");
  }
  return request.user;
});
