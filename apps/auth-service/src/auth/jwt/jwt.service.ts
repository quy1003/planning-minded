import { Injectable } from "@nestjs/common";
import type { UserRole } from "@tripmind/shared";
import { userRoleSchema } from "@tripmind/shared";
import { importJWK, jwtVerify, SignJWT } from "jose";
import { ConfigService } from "../../config/config.service";

const ACCESS_TOKEN_TTL = "15m";

export type AccessTokenClaims = {
  sub: string;
  role: UserRole;
};

/** Ký/verify access token JWT bằng cặp khóa EdDSA đã chuẩn bị ở task #1 (JWKS). */
@Injectable()
export class JwtService {
  constructor(private readonly configService: ConfigService) {}

  async signAccessToken(userId: string, role: UserRole): Promise<string> {
    const privateKey = await importJWK(this.configService.jwtPrivateJwk, "EdDSA");
    return new SignJWT({ role })
      .setProtectedHeader({ alg: "EdDSA", kid: this.configService.jwtKeyId })
      .setSubject(userId)
      .setIssuedAt()
      .setExpirationTime(ACCESS_TOKEN_TTL)
      .sign(privateKey);
  }

  async verifyAccessToken(token: string): Promise<AccessTokenClaims> {
    const publicKey = await importJWK(this.configService.jwtPublicJwk, "EdDSA");
    const { payload } = await jwtVerify(token, publicKey, { algorithms: ["EdDSA"] });
    if (typeof payload.sub !== "string") {
      throw new Error("Access token thiếu claim 'sub'");
    }
    const role = userRoleSchema.parse(payload.role);
    return { sub: payload.sub, role };
  }
}
