import { Module } from "@nestjs/common";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";

/**
 * Phase 2 task #7: đăng ký/đăng nhập/refresh/revoke đã chuyển hết sang
 * apps/auth-service. apps/api chỉ còn VERIFY token — JwtAuthGuard fetch JWKS
 * qua network thật tới auth-service (không còn loopback nội bộ như monolith cũ).
 */
@Module({
  providers: [JwtAuthGuard],
  exports: [JwtAuthGuard],
})
export class AuthModule {}
