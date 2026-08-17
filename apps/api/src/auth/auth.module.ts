import { Module } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { LocalAuthGuard } from "./guards/local-auth.guard";
import { JwksController } from "./jwks.controller";
import { JwtService } from "./jwt.service";
import { RefreshTokenService } from "./refresh-token.service";
import { LocalStrategy } from "./strategies/local.strategy";

@Module({
  // session: false — task #6 bỏ hẳn session, login/register giờ trả JWT.
  imports: [PassportModule.register({ session: false })],
  controllers: [AuthController, JwksController],
  providers: [AuthService, JwtService, RefreshTokenService, LocalStrategy, LocalAuthGuard, JwtAuthGuard],
  // JwtAuthGuard export để TripModule (module khác) dùng chung, thay SessionAuthGuard cũ.
  exports: [AuthService, JwtService, RefreshTokenService, JwtAuthGuard],
})
export class AuthModule {}
