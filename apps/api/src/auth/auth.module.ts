import { Module } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { LocalAuthGuard } from "./guards/local-auth.guard";
import { SessionAuthGuard } from "./guards/session-auth.guard";
import { JwksController } from "./jwks.controller";
import { JwtService } from "./jwt.service";
import { SessionSerializer } from "./serializers/session.serializer";
import { LocalStrategy } from "./strategies/local.strategy";

@Module({
  imports: [PassportModule.register({ session: true })],
  controllers: [AuthController, JwksController],
  providers: [
    AuthService,
    JwtService,
    LocalStrategy,
    SessionSerializer,
    LocalAuthGuard,
    SessionAuthGuard,
    JwtAuthGuard,
  ],
  exports: [AuthService, JwtService, SessionAuthGuard],
})
export class AuthModule {}
