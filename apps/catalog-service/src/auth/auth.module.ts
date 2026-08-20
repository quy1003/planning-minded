import { Module } from "@nestjs/common";
import { AdminGuard } from "./guards/admin.guard";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";

/**
 * Phase 2 task #7: đăng ký/đăng nhập/refresh/revoke đã chuyển hết sang
 * apps/auth-service. catalog-service chỉ VERIFY token — JwtAuthGuard fetch JWKS
 * qua network thật tới auth-service (không còn loopback nội bộ như monolith cũ).
 * AdminGuard (Phase 3 task #3) đứng cạnh JwtAuthGuard — cùng là guard xác thực/phân quyền.
 */
@Module({
  providers: [JwtAuthGuard, AdminGuard],
  exports: [JwtAuthGuard, AdminGuard],
})
export class AuthModule {}
