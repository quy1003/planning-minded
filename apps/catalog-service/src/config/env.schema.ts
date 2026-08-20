import { z } from "zod";

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  // 3000 = apps/api, 3001 = web, 3002 = auth-service (test: 3003), 3004 = trip-service
  // (test: 3005) — catalog-service dùng 3006 để không đụng ai (test riêng: 3007).
  PORT: z.coerce.number().int().positive().default(3006),
  DATABASE_URL: z.string().url(),
  /** Origin Next.js web — dùng cho CORS credentials (local: http://localhost:3001). */
  WEB_ORIGIN: z.string().url().default("http://localhost:3001"),
  /**
   * Domain auth-service — JwtAuthGuard fetch JWKS từ đây qua HTTP thật (Phase 2
   * task #7, khác monolith cũ tự loopback vào chính mình).
   */
  AUTH_SERVICE_URL: z.string().url().default("http://localhost:3002"),
});

export type Env = z.infer<typeof envSchema>;
