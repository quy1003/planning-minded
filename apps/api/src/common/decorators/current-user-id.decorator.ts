import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { Request } from "express";

/** Lấy `req.jwtUser.id` — set bởi JwtAuthGuard sau khi verify JWT. */
export const CurrentUserId = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest<Request>();
  if (!request.jwtUser) {
    // JwtAuthGuard đã chặn trước; nếu tới đây là lỗi cấu hình (thiếu guard).
    throw new Error("CurrentUserId used without JwtAuthGuard");
  }
  return request.jwtUser.id;
});
