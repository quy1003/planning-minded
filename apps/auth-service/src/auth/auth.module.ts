import { Module } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";
import { JwtAuthGuard, JWKS_URL } from "@tripmind/shared";
import { AuthController } from "./auth.controller";
import { JwtService } from "./jwt/jwt.service";
import { JwksController } from "./jwks/jwks.controller";
import { AuthService } from "./login/auth.service";
import { LocalAuthGuard } from "./login/local-auth.guard";
import { LocalStrategy } from "./login/local.strategy";
import { LoginRateLimitGuard } from "./rate-limit/login-rate-limit.guard";
import { RefreshTokenService } from "./refresh-token/refresh-token.service";
import { ConfigService } from "../config/config.service";

@Module({
  // session: false — task #6 bỏ hẳn session, login/register giờ trả JWT.
  imports: [PassportModule.register({ session: false })],
  controllers: [AuthController, JwksController],
  providers: [
    AuthService,
    JwtService,
    RefreshTokenService,
    LocalStrategy,
    LocalAuthGuard,
    JwtAuthGuard,
    // JwtAuthGuard giờ ở packages/shared (Phase 3 task #5, gộp tránh duplicate 5 bản) — cần
    // tự provide JWKS_URL từ ConfigService của chính app này.
    { provide: JWKS_URL, useFactory: (config: ConfigService) => config.jwksUrl, inject: [ConfigService] },
    LoginRateLimitGuard,
  ],
  // JwtAuthGuard export để TripModule (module khác) dùng chung, thay SessionAuthGuard cũ.
  exports: [AuthService, JwtService, RefreshTokenService, JwtAuthGuard, JWKS_URL],
})
export class AuthModule {}
