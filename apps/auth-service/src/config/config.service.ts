import { Injectable } from "@nestjs/common";
import { envSchema, type Env, type JwtPrivateJwk, type JwtPublicJwk } from "./env.schema";

@Injectable()
export class ConfigService {
  private readonly env: Env;

  constructor() {
    const result = envSchema.safeParse(process.env);
    if (!result.success) {
      const issues = result.error.issues.map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`).join("\n");
      throw new Error(`ENV invalid:\n${issues}`);
    }
    this.env = result.data;
  }

  get port(): number {
    return this.env.PORT;
  }

  get databaseUrl(): string {
    return this.env.DATABASE_URL;
  }

  get redisUrl(): string {
    return this.env.REDIS_URL;
  }

  get isProduction(): boolean {
    return this.env.NODE_ENV === "production";
  }

  get webOrigin(): string {
    return this.env.WEB_ORIGIN;
  }

  /** Private JWK (có `d`) — chỉ dùng để ký token, không bao giờ log/return ra HTTP. */
  get jwtPrivateJwk(): JwtPrivateJwk {
    return this.env.JWT_PRIVATE_JWK;
  }

  /** Public JWK (không có `d`) — đưa vào JWKS endpoint. */
  get jwtPublicJwk(): JwtPublicJwk {
    const publicJwk: JwtPrivateJwk = { ...this.env.JWT_PRIVATE_JWK };
    delete (publicJwk as Partial<JwtPrivateJwk>).d;
    return publicJwk;
  }

  get jwtKeyId(): string {
    return this.env.JWT_PRIVATE_JWK.kid;
  }

  /**
   * URL JWKS của chính auth-service — dùng cho JwtAuthGuard bảo vệ route nội bộ
   * của chính nó (vd /auth/logout-all). Loopback vì cùng process với JwksController.
   */
  get jwksUrl(): string {
    return `http://localhost:${this.env.PORT}/.well-known/jwks.json`;
  }
}
