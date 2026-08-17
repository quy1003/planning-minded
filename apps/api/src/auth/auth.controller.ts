import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { refreshTokenSchema, registerSchema, type RefreshTokenInput, type RegisterInput } from "@tripmind/shared";
import type { Request } from "express";
import { CurrentUser, type AuthUser } from "../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { LocalAuthGuard } from "./guards/local-auth.guard";
import { SessionAuthGuard } from "./guards/session-auth.guard";
import { JwtService } from "./jwt.service";
import { RefreshTokenService } from "./refresh-token.service";

export type RefreshResponse = {
  accessToken: string;
  refreshToken: string;
};

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  register(@Body(new ZodValidationPipe(registerSchema)) body: RegisterInput): Promise<AuthUser> {
    return this.authService.register(body);
  }

  @Post("login")
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  login(@CurrentUser() user: AuthUser): AuthUser {
    // LocalAuthGuard đã validate body + password + ghi session.
    return user;
  }

  @Post("logout")
  @UseGuards(SessionAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req: Request): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      req.logout((err: Error | undefined) => {
        if (err) reject(err);
        else resolve();
      });
    });
    await new Promise<void>((resolve, reject) => {
      req.session.destroy((err: Error | undefined) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  @Get("me")
  @UseGuards(SessionAuthGuard)
  me(@CurrentUser() user: AuthUser): AuthUser {
    return user;
  }

  /**
   * Đưa refresh token cũ, nhận access token mới + refresh token mới (rotation —
   * token cũ vô hiệu ngay). Chưa route thật nào issue refresh token (task #6) —
   * task #4 test bằng cách tự gọi RefreshTokenService.issue() trong test/script.
   */
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body(new ZodValidationPipe(refreshTokenSchema)) body: RefreshTokenInput,
  ): Promise<RefreshResponse> {
    const { userId, newToken } = await this.refreshTokenService.rotate(body.refreshToken);
    const accessToken = await this.jwtService.signAccessToken(userId);
    return { accessToken, refreshToken: newToken };
  }

  /**
   * Route test tạm cho JwtAuthGuard (Phase 2 task #3) — chứng minh verify JWT offline
   * hoạt động. KHÔNG phải API thật, chưa route CRUD nào dùng JwtAuthGuard.
   * Dọn ở task #6 khi migrate login/me thật sang JWT.
   */
  @Get("whoami-jwt")
  @UseGuards(JwtAuthGuard)
  whoamiJwt(@Req() req: Request): { id: string } {
    if (!req.jwtUser) {
      throw new Error("JwtAuthGuard đã pass nhưng thiếu req.jwtUser — kiểm tra lại guard");
    }
    return req.jwtUser;
  }
}
