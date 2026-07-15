import {
  Injectable,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from "@nestjs/common";
import type { Request } from "express";

/** Cho qua chỉ khi đã có session đăng nhập (`req.isAuthenticated()`). */
@Injectable()
export class SessionAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    if (typeof request.isAuthenticated !== "function" || !request.isAuthenticated()) {
      throw new UnauthorizedException({ detail: "Not authenticated" });
    }
    return true;
  }
}
