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

  get sessionSecret(): string {
    return this.env.SESSION_SECRET;
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
   * URL JWKS của chính app này — gọi qua loopback (`localhost:PORT`), không phải domain public.
   * Guard verify JWT chạy trong CÙNG process đang serve endpoint này, nên loopback luôn đúng dù
   * production đứng sau reverse proxy nào (proxy không liên quan tới traffic nội bộ này).
   */
  get jwksUrl(): string {
    return `http://localhost:${this.env.PORT}/.well-known/jwks.json`;
  }
}
