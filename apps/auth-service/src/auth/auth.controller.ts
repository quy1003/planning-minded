import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { registerSchema, type RegisterInput } from "@tripmind/shared";
import type { Request, Response } from "express";
import { CurrentUser, type AuthUser } from "../common/decorators/current-user.decorator";
import { CurrentUserId } from "../common/decorators/current-user-id.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { ConfigService } from "../config/config.service";
import { JwtAuthGuard } from "./jwt/jwt-auth.guard";
import { JwtService } from "./jwt/jwt.service";
import { AuthService } from "./login/auth.service";
import { LocalAuthGuard } from "./login/local-auth.guard";
import { LoginRateLimitGuard } from "./rate-limit/login-rate-limit.guard";
import {
  clearRefreshTokenCookie,
  REFRESH_TOKEN_COOKIE_NAME,
  setRefreshTokenCookie,
} from "./refresh-token/refresh-token-cookie";
import { RefreshTokenService } from "./refresh-token/refresh-token.service";

export type AuthTokenResponse = {
  accessToken: string;
  user: AuthUser;
};

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly configService: ConfigService,
  ) {}

  /** Ký access token + issue refresh token (cookie) — dùng chung cho register và login. */
  private async issueTokens(user: AuthUser, res: Response): Promise<AuthTokenResponse> {
    const accessToken = await this.jwtService.signAccessToken(user.id);
    const refreshToken = await this.refreshTokenService.issue(user.id);
    setRefreshTokenCookie(res, refreshToken, this.configService);
    return { accessToken, user };
  }

  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body(new ZodValidationPipe(registerSchema)) body: RegisterInput,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthTokenResponse> {
    const user = await this.authService.register(body);
    return this.issueTokens(user, res);
  }

  @Post("login")
  @UseGuards(LoginRateLimitGuard, LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  async login(
    @CurrentUser() user: AuthUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthTokenResponse> {
    // LocalAuthGuard đã validate body + verify password (gán request.user).
    return this.issueTokens(user, res);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUserId() userId: string): Promise<AuthUser> {
    const user = await this.authService.findById(userId);
    if (!user) {
      // User bị xóa sau khi access token đã phát hành (hiếm) — token còn hạn nhưng user không còn.
      throw new UnauthorizedException({ detail: "User not found" });
    }
    return user;
  }

  /**
   * Đưa refresh token (đọc từ cookie httpOnly — KHÔNG nhận qua body, xem
   * docs/adr/006-refresh-token-storage.md), nhận access token mới + set lại cookie
   * refresh token mới (rotation — token cũ vô hiệu ngay).
   */
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string }> {
    const oldRefreshToken = req.cookies[REFRESH_TOKEN_COOKIE_NAME] as string | undefined;
    if (!oldRefreshToken) {
      throw new UnauthorizedException({ detail: "Missing refresh token" });
    }

    const { userId, newToken } = await this.refreshTokenService.rotate(oldRefreshToken);
    setRefreshTokenCookie(res, newToken, this.configService);
    const accessToken = await this.jwtService.signAccessToken(userId);
    return { accessToken };
  }

  /** Thu hồi refresh token hiện tại (thiết bị này) + xóa cookie. Idempotent. */
  @Post("logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<void> {
    const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE_NAME] as string | undefined;
    if (refreshToken) {
      await this.refreshTokenService.revoke(refreshToken);
    }
    clearRefreshTokenCookie(res);
  }

  /**
   * Thu hồi TOÀN BỘ refresh token của user hiện tại (đăng xuất mọi thiết bị) — cần
   * access token hợp lệ để biết chắc đang thu hồi đúng user nào.
   */
  @Post("logout-all")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logoutAll(
    @CurrentUserId() userId: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.refreshTokenService.revokeAll(userId);
    clearRefreshTokenCookie(res);
  }
}
