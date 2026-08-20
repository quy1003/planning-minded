import { Module } from "@nestjs/common";
import { JwtAuthGuard, JWKS_URL } from "@tripmind/shared";
import { ConfigService } from "../config/config.service";

/**
 * Phase 2 task #7: đăng ký/đăng nhập/refresh/revoke đã chuyển hết sang
 * apps/auth-service. api-gateway chỉ VERIFY token (dùng cho /trips/*, xem proxy.module.ts) —
 * JwtAuthGuard fetch JWKS qua network thật tới auth-service.
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
