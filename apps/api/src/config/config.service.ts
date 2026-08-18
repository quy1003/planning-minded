import { Injectable } from "@nestjs/common";
import { envSchema, type Env } from "./env.schema";

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

  get isProduction(): boolean {
    return this.env.NODE_ENV === "production";
  }

  get webOrigin(): string {
    return this.env.WEB_ORIGIN;
  }

  /**
   * URL JWKS của auth-service (Phase 2 task #7) — gọi qua network thật, khác
   * monolith cũ tự loopback vào chính mình (task #1-#6).
   */
  get jwksUrl(): string {
    return `${this.env.AUTH_SERVICE_URL}/.well-known/jwks.json`;
  }
}
