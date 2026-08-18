import { Injectable } from "@nestjs/common";
import { importJWK, jwtVerify, SignJWT } from "jose";
import { ConfigService } from "../../config/config.service";

const ACCESS_TOKEN_TTL = "15m";

export type AccessTokenClaims = {
  sub: string;
};

/** Ký/verify access token JWT bằng cặp khóa EdDSA đã chuẩn bị ở task #1 (JWKS). */
@Injectable()
export class JwtService {
  constructor(private readonly configService: ConfigService) {}

  async signAccessToken(userId: string): Promise<string> {
    const privateKey = await importJWK(this.configService.jwtPrivateJwk, "EdDSA");
    return new SignJWT({})
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
    return { sub: payload.sub };
  }
}
