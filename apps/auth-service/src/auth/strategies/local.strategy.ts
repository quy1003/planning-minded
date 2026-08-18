import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-local";
import type { AuthUser } from "../../common/decorators/current-user.decorator";
import { AuthService } from "../auth.service";

/**
 * Strategy "local" = email + password.
 * `usernameField: "email"` vì passport-local mặc định đọc field tên `username`.
 */
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({ usernameField: "email" });
  }

  async validate(email: string, password: string): Promise<AuthUser> {
    const user = await this.authService.validateUser(email, password);
    if (!user) {
      // Không nói email hay password sai — tránh enumeration.
      throw new UnauthorizedException({ detail: "Invalid email or password" });
    }
    return user;
  }
}
