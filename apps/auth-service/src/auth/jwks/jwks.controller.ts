import { Controller, Get, VERSION_NEUTRAL } from "@nestjs/common";
import { SkipResponseTransform } from "../../common/decorators/skip-response-transform.decorator";
import { ConfigService } from "../../config/config.service";
import type { JwtPublicJwk } from "../../config/env.schema";

export type JwksResponse = {
  keys: JwtPublicJwk[];
};

/**
 * JWKS công khai — service khác (và task #3) lấy public key để verify JWT.
 * Không cần auth: đây là “mẫu con dấu” public.
 * version: VERSION_NEUTRAL — `.well-known/*` là path chuẩn (RFC 8615), không được mang
 * tiền tố version như route API thường.
 */
@Controller({ path: ".well-known", version: VERSION_NEUTRAL })
export class JwksController {
  constructor(private readonly configService: ConfigService) {}

  @Get("jwks.json")
  @SkipResponseTransform()
  getJwks(): JwksResponse {
    return { keys: [this.configService.jwtPublicJwk] };
  }
}
