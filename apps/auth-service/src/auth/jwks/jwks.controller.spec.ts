import { Test } from "@nestjs/testing";
import { ConfigService } from "../../config/config.service";
import type { JwtPublicJwk } from "../../config/env.schema";
import { JwksController } from "./jwks.controller";

describe("JwksController", () => {
  const publicJwk: JwtPublicJwk = {
    kty: "OKP",
    crv: "Ed25519",
    x: "test-public-x",
    kid: "test-kid",
    alg: "EdDSA",
    use: "sig",
  };

  let controller: JwksController;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [JwksController],
      providers: [
        {
          provide: ConfigService,
          useValue: { jwtPublicJwk: publicJwk },
        },
      ],
    }).compile();

    controller = moduleRef.get(JwksController);
  });

  it("returns JWKS with public key only (no private field d)", () => {
    const jwks = controller.getJwks();

    expect(jwks).toEqual({ keys: [publicJwk] });
    expect(jwks.keys[0]).not.toHaveProperty("d");
  });
});
