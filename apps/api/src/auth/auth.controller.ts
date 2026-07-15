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
import { registerSchema, type RegisterInput } from "@tripmind/shared";
import type { Request } from "express";
import { CurrentUser, type AuthUser } from "../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { AuthService } from "./auth.service";
import { LocalAuthGuard } from "./guards/local-auth.guard";
import { SessionAuthGuard } from "./guards/session-auth.guard";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
}
