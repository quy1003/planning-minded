import { Injectable } from "@nestjs/common";
import { PassportSerializer } from "@nestjs/passport";
import type { AuthUser } from "../../common/decorators/current-user.decorator";
import { AuthService } from "../auth.service";

/**
 * Session chỉ lưu userId (nhẹ). Mỗi request Passport gọi deserializeUser
 * → load lại user từ DB gắn vào req.user.
 */
@Injectable()
export class SessionSerializer extends PassportSerializer {
  constructor(private readonly authService: AuthService) {
    super();
  }

  serializeUser(user: AuthUser, done: (err: Error | null, id?: string) => void): void {
    done(null, user.id);
  }

  async deserializeUser(
    id: string,
    done: (err: Error | null, user?: AuthUser | false) => void,
  ): Promise<void> {
    try {
      const user = await this.authService.findById(id);
      done(null, user ?? false);
    } catch (error: unknown) {
      done(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
