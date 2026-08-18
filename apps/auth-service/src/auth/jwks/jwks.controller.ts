import { Controller, Get } from "@nestjs/common";
import { SkipResponseTransform } from "../../common/decorators/skip-response-transform.decorator";
import { ConfigService } from "../../config/config.service";
import type { JwtPublicJwk } from "../../config/env.schema";

export type JwksResponse = {
  keys: JwtPublicJwk[];
};

/**
 * JWKS công khai — service khác (và task #3) lấy public key để verify JWT.
 * Không cần auth: đây là “mẫu con dấu” public.
 */
@Controller(".well-known")
export class JwksController {
  constructor(private readonly configService: ConfigService) {}

  @Get("jwks.json")
  @SkipResponseTransform()
  getJwks(): JwksResponse {
    return { keys: [this.configService.jwtPublicJwk] };
  }
}
