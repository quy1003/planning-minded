import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import type { App } from "supertest/types";
import { AppModule } from "../src/app.module";
import { JwtService } from "../src/auth/jwt.service";
import { RefreshTokenService } from "../src/auth/refresh-token.service";
import { configureApp } from "../src/bootstrap/configure-app";
import { ConfigService } from "../src/config/config.service";
import {
  startTestInfrastructure,
  stopTestInfrastructure,
  type TestInfrastructure,
} from "./db-test-helper";

describe("POST /auth/revoke, /auth/revoke-all (integration)", () => {
  let app: INestApplication;
  let infra: TestInfrastructure;
  let server: App;
  let refreshTokenService: RefreshTokenService;
  let jwtService: JwtService;

  beforeAll(async () => {
    infra = await startTestInfrastructure();

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    const configService = app.get(ConfigService);
    refreshTokenService = app.get(RefreshTokenService);
    jwtService = app.get(JwtService);
    configureApp(app, configService);

    // /auth/revoke-all dùng JwtAuthGuard, tự fetch JWKS của chính app này qua HTTP
    // thật — phải listen ở đúng port configService.port (giống task #3).
    await app.listen(configService.port);
    server = app.getHttpServer() as App;
  }, 120_000);

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    if (infra) {
      await stopTestInfrastructure(infra);
    }
  });

  async function registerTestUser(email: string): Promise<string> {
    const res = await request(server)
      .post("/auth/register")
      .send({ email, password: "password123" })
      .expect(201);
    return res.body.data.id as string;
  }

  describe("POST /auth/revoke", () => {
    it("revokes a refresh token — refreshing with it afterwards fails (401)", async () => {
      const userId = await registerTestUser("revoke-1@tripmind.test");
      const token = await refreshTokenService.issue(userId);

      await request(server).post("/auth/revoke").send({ refreshToken: token }).expect(204);

      await request(server).post("/auth/refresh").send({ refreshToken: token }).expect(401);
    });

    it("is idempotent — revoking a token that never existed still returns 204", async () => {
      await request(server)
        .post("/auth/revoke")
        .send({ refreshToken: "not-a-real-token" })
        .expect(204);
    });
  });

  describe("POST /auth/revoke-all", () => {
    it("revokes every refresh token for the current user, not other users'", async () => {
      const userId = await registerTestUser("revoke-all-1@tripmind.test");
      const otherUserId = await registerTestUser("revoke-all-2@tripmind.test");

      const tokenA1 = await refreshTokenService.issue(userId);
      const tokenA2 = await refreshTokenService.issue(userId);
      const tokenOther = await refreshTokenService.issue(otherUserId);

      const accessToken = await jwtService.signAccessToken(userId);
      await request(server)
        .post("/auth/revoke-all")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(204);

      await request(server).post("/auth/refresh").send({ refreshToken: tokenA1 }).expect(401);
      await request(server).post("/auth/refresh").send({ refreshToken: tokenA2 }).expect(401);
      await request(server).post("/auth/refresh").send({ refreshToken: tokenOther }).expect(200);
    });

    it("rejects without a valid access token (401)", async () => {
      await request(server).post("/auth/revoke-all").expect(401);
    });
  });
});
