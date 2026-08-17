import { z } from "zod";

/** Private Ed25519 JWK lưu trong .env (1 dòng JSON). Field `d` = bí mật — không bao giờ đưa ra JWKS. */
export const jwtPrivateJwkSchema = z.object({
  kty: z.literal("OKP"),
  crv: z.literal("Ed25519"),
  d: z.string().min(1),
  x: z.string().min(1),
  kid: z.string().min(1),
  alg: z.literal("EdDSA").optional(),
  use: z.literal("sig").optional(),
});

export type JwtPrivateJwk = z.infer<typeof jwtPrivateJwkSchema>;

/** Public JWK = private bỏ `d` — đúng shape endpoint JWKS sẽ trả. */
export type JwtPublicJwk = Omit<JwtPrivateJwk, "d">;

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  /** Origin Next.js web — dùng cho CORS credentials (local: http://localhost:3001). */
  WEB_ORIGIN: z.string().url().default("http://localhost:3001"),
  /**
   * Ed25519 private JWK (JSON string). Chỉ auth giữ — dùng ký JWT (task sau)
   * và derive public JWK cho JWKS (bỏ field d).
   */
  JWT_PRIVATE_JWK: z
    .string()
    .min(1, "JWT_PRIVATE_JWK bắt buộc")
    .transform((raw, ctx): JwtPrivateJwk => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "JWT_PRIVATE_JWK phải là JSON hợp lệ" });
        return z.NEVER;
      }
      const jwkResult = jwtPrivateJwkSchema.safeParse(parsed);
      if (!jwkResult.success) {
        for (const issue of jwkResult.error.issues) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: issue.message,
            path: issue.path,
          });
        }
        return z.NEVER;
      }
      return jwkResult.data;
    }),
});

export type Env = z.infer<typeof envSchema>;
