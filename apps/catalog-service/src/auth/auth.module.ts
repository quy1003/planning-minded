import { Module } from "@nestjs/common";
import { JwtAuthGuard, JWKS_URL } from "@tripmind/shared";
import { ConfigService } from "../config/config.service";
import { AdminGuard } from "./guards/admin.guard";

/**
 * Phase 2 task #7: đăng ký/đăng nhập/refresh/revoke đã chuyển hết sang
 * apps/auth-service. catalog-service chỉ VERIFY token — JwtAuthGuard fetch JWKS
 * qua network thật tới auth-service (không còn loopback nội bộ như monolith cũ).
 * JwtAuthGuard giờ ở packages/shared (Phase 3 task #5, gộp tránh duplicate 5 bản) — cần tự
 * provide JWKS_URL từ ConfigService của chính app này. AdminGuard (Phase 3 task #3) đứng
 * cạnh — cùng là guard xác thực/phân quyền, nhưng chỉ dùng ở đây nên chưa cần gộp chung.
 */
@Module({
  providers: [
    JwtAuthGuard,
    { provide: JWKS_URL, useFactory: (config: ConfigService) => config.jwksUrl, inject: [ConfigService] },
    AdminGuard,
  ],
  exports: [JwtAuthGuard, JWKS_URL, AdminGuard],
})
export class AuthModule {}
