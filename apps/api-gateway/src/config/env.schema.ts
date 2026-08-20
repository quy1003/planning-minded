import { z } from "zod";

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  // 3000 = apps/api, 3001 = web, 3002 = auth-service (test: 3003), 3004 = trip-service
  // (test: 3005), 3006 = catalog-service (test: 3007) — api-gateway dùng 3008 (test: 3009).
  PORT: z.coerce.number().int().positive().default(3008),
  /** Origin Next.js web — dùng cho CORS credentials (local: http://localhost:3001). */
  WEB_ORIGIN: z.string().url().default("http://localhost:3001"),
  /** JwtAuthGuard của chính gateway fetch JWKS từ đây (chỉ áp cho route /trips/*, xem proxy.module.ts). */
  AUTH_SERVICE_URL: z.string().url().default("http://localhost:3002"),
  /** 4 URL đích để proxy — cùng khái niệm "internal URL" mà trước đây apps/web tự dùng để
   * rewrite (task #1-#3); giờ api-gateway là nơi duy nhất biết routing table này. */
  AUTH_SERVICE_INTERNAL_URL: z.string().url().default("http://localhost:3002"),
  TRIP_SERVICE_INTERNAL_URL: z.string().url().default("http://localhost:3004"),
  CATALOG_SERVICE_INTERNAL_URL: z.string().url().default("http://localhost:3006"),
  API_INTERNAL_URL: z.string().url().default("http://localhost:3000"),
});

export type Env = z.infer<typeof envSchema>;
