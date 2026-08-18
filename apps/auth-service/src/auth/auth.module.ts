import { Module } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";
import { AuthController } from "./auth.controller";
import { JwtAuthGuard } from "./jwt/jwt-auth.guard";
import { JwtService } from "./jwt/jwt.service";
import { JwksController } from "./jwks/jwks.controller";
import { AuthService } from "./login/auth.service";
import { LocalAuthGuard } from "./login/local-auth.guard";
import { LocalStrategy } from "./login/local.strategy";
import { LoginRateLimitGuard } from "./rate-limit/login-rate-limit.guard";
import { RefreshTokenService } from "./refresh-token/refresh-token.service";

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
    LoginRateLimitGuard,
  ],
  // JwtAuthGuard export để TripModule (module khác) dùng chung, thay SessionAuthGuard cũ.
  exports: [AuthService, JwtService, RefreshTokenService, JwtAuthGuard],
})
export class AuthModule {}
