import type { AuthUser } from "../common/decorators/current-user.decorator";

// `Request.jwtUser` giờ khai báo global trong packages/shared/src/auth/jwt-auth.guard.ts —
// merge tự động cho app này (đã import JwtAuthGuard từ đó) — không khai báo lại ở đây, tránh
// đúng thứ đang cố tránh (duplicate declaration, dễ lệch type nếu 1 nơi đổi 1 nơi không).
declare global {
  namespace Express {
    // Passport gắn user đã login vào req.user với type này.
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- interface merge với AuthUser
    interface User extends AuthUser {}
  }
}

export {};
