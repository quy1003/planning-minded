import { BadRequestException, Injectable, type ExecutionContext } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { loginSchema } from "@tripmind/shared";
import type { Request } from "express";

/**
 * Chạy LocalStrategy để verify email/password — chỉ gán `request.user` (đọc qua
 * `@CurrentUser()`), KHÔNG ghi session (Phase 2 task #6: login trả JWT, AuthController
 * tự ký access/refresh token sau khi guard này pass — không còn session cookie).
 * Validate body trước vì Nest chạy Guard trước Pipe — nếu không, lỗi format sẽ thành 401 thay vì 400.
 */
@Injectable()
export class LocalAuthGuard extends AuthGuard("local") {
  override async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const parsed = loginSchema.safeParse(request.body);

    if (!parsed.success) {
      throw new BadRequestException({
        detail: "Validation failed",
        errors: parsed.error.issues.map((issue) => ({
          path: issue.path.join(".") || "(root)",
          message: issue.message,
        })),
      });
    }
    request.body = parsed.data;

    return (await super.canActivate(context)) as boolean;
  }
}
