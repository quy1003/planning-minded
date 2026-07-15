import { BadRequestException, Injectable, type ExecutionContext } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { loginSchema } from "@tripmind/shared";
import type { Request } from "express";

/**
 * Chạy LocalStrategy; nếu ok thì `logIn()` ghi user vào session (cookie).
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

    const activated = (await super.canActivate(context)) as boolean;
    await super.logIn(request);
    return activated;
  }
}
