import { Module } from "@nestjs/common";
import { JwtAuthGuard, JWKS_URL } from "@tripmind/shared";
import { ConfigService } from "../config/config.service";

/**
 * Phase 2 task #7: đăng ký/đăng nhập/refresh/revoke đã chuyển hết sang
 * apps/auth-service. apps/api chỉ còn VERIFY token — JwtAuthGuard fetch JWKS
 * qua network thật tới auth-service (không còn loopback nội bộ như monolith cũ).
 * JwtAuthGuard giờ ở packages/shared (Phase 3 task #5, gộp tránh duplicate 5 bản) — cần tự
 * provide JWKS_URL từ ConfigService của chính app này.
 */
@Module({
  providers: [
    JwtAuthGuard,
    { provide: JWKS_URL, useFactory: (config: ConfigService) => config.jwksUrl, inject: [ConfigService] },
  ],
  exports: [JwtAuthGuard, JWKS_URL],
})
export class AuthModule {}
