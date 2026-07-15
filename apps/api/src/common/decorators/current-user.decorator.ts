import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { Request } from "express";

/** User gắn vào session (không gồm passwordHash). */
export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
};

type RequestWithUser = Request & { user?: AuthUser };

/** Lấy `req.user` — dùng: `me(@CurrentUser() user: AuthUser)`. */
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): AuthUser => {
  const request = ctx.switchToHttp().getRequest<RequestWithUser>();
  if (!request.user) {
    // Guard đã chặn trước; nếu tới đây là lỗi cấu hình.
    throw new Error("CurrentUser used without authenticated user");
  }
  return request.user;
});
