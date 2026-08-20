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

  get isProduction(): boolean {
    return this.env.NODE_ENV === "production";
  }

  get webOrigin(): string {
    return this.env.WEB_ORIGIN;
  }

  get jwksUrl(): string {
    return `${this.env.AUTH_SERVICE_URL}/.well-known/jwks.json`;
  }

  get authServiceInternalUrl(): string {
    return this.env.AUTH_SERVICE_INTERNAL_URL;
  }

  get tripServiceInternalUrl(): string {
    return this.env.TRIP_SERVICE_INTERNAL_URL;
  }

  get catalogServiceInternalUrl(): string {
    return this.env.CATALOG_SERVICE_INTERNAL_URL;
  }

  get apiInternalUrl(): string {
    return this.env.API_INTERNAL_URL;
  }
}
