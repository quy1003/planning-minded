declare global {
  namespace Express {
    interface Request {
      // Gắn bởi JwtAuthGuard sau khi verify JWT — apps/api không còn Passport/login
      // (đã chuyển sang apps/auth-service, task #7), chỉ verify nên chỉ cần `sub`.
      jwtUser?: { id: string };
    }
  }
}

export {};
