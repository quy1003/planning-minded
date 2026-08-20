import type { UserRole } from "@tripmind/shared";

declare global {
  namespace Express {
    interface Request {
      // Gắn bởi JwtAuthGuard sau khi verify JWT — apps/api không còn Passport/login
      // (đã chuyển sang apps/auth-service, task #7). `role` thêm ở Phase 3 task #3
      // (catalog-service AdminGuard).
      jwtUser?: { id: string; role: UserRole };
    }
  }
}

export {};
