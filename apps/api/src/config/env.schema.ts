import { z } from "zod";

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
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
