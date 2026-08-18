import { Test } from "@nestjs/testing";
import { SignJWT, importJWK } from "jose";
import { ConfigService } from "../../config/config.service";
import type { JwtPrivateJwk, JwtPublicJwk } from "../../config/env.schema";
import { JwtService } from "./jwt.service";

// Keypair disposable chỉ dùng trong test — không phải key thật (giống test/db-test-helper.ts).
const testPrivateJwk: JwtPrivateJwk = {
  kty: "OKP",
  crv: "Ed25519",
  d: "RbCp_y-14dBXUwsobexKEGv7uyr5EER0qwo20Vq5LYc",
  x: "i-hP5gzWiXKIwZj8tYA7Yu4GPwZfpvs6fdOFQkQr_8Q",
  kid: "test-jwt-key-id",
  alg: "EdDSA",
  use: "sig",
};

const testPublicJwk: JwtPublicJwk = {
  kty: testPrivateJwk.kty,
  crv: testPrivateJwk.crv,
  x: testPrivateJwk.x,
  kid: testPrivateJwk.kid,
  alg: testPrivateJwk.alg,
  use: testPrivateJwk.use,
};

describe("JwtService", () => {
  let jwtService: JwtService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        JwtService,
        {
          provide: ConfigService,
          useValue: {
            jwtPrivateJwk: testPrivateJwk,
            jwtPublicJwk: testPublicJwk,
            jwtKeyId: testPrivateJwk.kid,
          },
        },
      ],
    }).compile();

    jwtService = moduleRef.get(JwtService);
  });

  it("ký token rồi verify lại đúng sub", async () => {
    const token = await jwtService.signAccessToken("user-1");

    const claims = await jwtService.verifyAccessToken(token);

    expect(claims.sub).toBe("user-1");
  });

  it("verify token đã hết hạn phải throw", async () => {
    const privateKey = await importJWK(testPrivateJwk, "EdDSA");
    const expiredToken = await new SignJWT({})
      .setProtectedHeader({ alg: "EdDSA", kid: testPrivateJwk.kid })
      .setSubject("user-1")
      .setIssuedAt()
      .setExpirationTime(Math.floor(Date.now() / 1000) - 60) // hết hạn 1 phút trước
      .sign(privateKey);

    await expect(jwtService.verifyAccessToken(expiredToken)).rejects.toThrow();
  });

  it("sửa 1 ký tự trong chữ ký thì verify phải fail (chống giả mạo)", async () => {
    const token = await jwtService.signAccessToken("user-1");
    const [header, payload, signature] = token.split(".");
    if (!header || !payload || !signature) {
      throw new Error("Token ký ra không đúng format header.payload.signature");
    }
    const tamperedChar = signature[0] === "A" ? "B" : "A";
    const tamperedToken = `${header}.${payload}.${tamperedChar}${signature.slice(1)}`;

    await expect(jwtService.verifyAccessToken(tamperedToken)).rejects.toThrow();
  });
});
