import type { AuthUser } from "../common/decorators/current-user.decorator";

declare global {
  namespace Express {
    // Passport gắn user đã login vào req.user với type này.
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- interface merge với AuthUser
    interface User extends AuthUser {}
  }
}

export {};
