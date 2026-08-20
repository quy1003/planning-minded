import type { UserRole } from "@tripmind/shared";
import type { AuthUser } from "../common/decorators/current-user.decorator";

declare global {
  namespace Express {
    // Passport gắn user đã login vào req.user với type này.
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- interface merge với AuthUser
    interface User extends AuthUser {}

    interface Request {
      // Gắn bởi JwtAuthGuard sau khi verify JWT (task #3, Phase 2) — tách riêng khỏi
      // req.user (Passport/session). `role` thêm ở Phase 3 task #3 (catalog-service AdminGuard).
      jwtUser?: { id: string; role: UserRole };
    }
  }
}

export {};
