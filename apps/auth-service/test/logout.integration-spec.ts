import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import type { App } from "supertest/types";
import { AppModule } from "../src/app.module";
import { JwtService } from "../src/auth/jwt/jwt.service";
import { REFRESH_TOKEN_COOKIE_NAME } from "../src/auth/refresh-token/refresh-token-cookie";
import { RefreshTokenService } from "../src/auth/refresh-token/refresh-token.service";
import { configureApp } from "../src/bootstrap/configure-app";
import { ConfigService } from "../src/config/config.service";
import {
  startTestInfrastructure,
  stopTestInfrastructure,
  type TestInfrastructure,
} from "./db-test-helper";

describe("POST /auth/logout, /auth/logout-all (integration)", () => {
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

    // /auth/logout-all dùng JwtAuthGuard, tự fetch JWKS của chính app này qua HTTP
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
      .post("/v1/auth/register")
      .send({ email, password: "password123" })
      .expect(201);
    return res.body.data.user.id as string;
  }

  // Task #6: refresh token đọc từ cookie httpOnly, KHÔNG còn nhận qua body.
  function refreshWithCookie(token: string) {
    return request(server).post("/v1/auth/refresh").set("Cookie", `${REFRESH_TOKEN_COOKIE_NAME}=${token}`);
  }

  describe("POST /auth/logout", () => {
    it("revokes the refresh token in the cookie — refreshing with it afterwards fails (401)", async () => {
      const userId = await registerTestUser("logout-1@tripmind.test");
      const token = await refreshTokenService.issue(userId);

      await request(server)
        .post("/v1/auth/logout")
        .set("Cookie", `${REFRESH_TOKEN_COOKIE_NAME}=${token}`)
        .expect(204);

      await refreshWithCookie(token).expect(401);
    });

    it("is idempotent — logging out with no cookie / an unknown token still returns 204", async () => {
      await request(server).post("/v1/auth/logout").expect(204);
      await request(server)
        .post("/v1/auth/logout")
        .set("Cookie", `${REFRESH_TOKEN_COOKIE_NAME}=not-a-real-token`)
        .expect(204);
    });

    it("clears the refresh token cookie", async () => {
      const userId = await registerTestUser("logout-2@tripmind.test");
      const token = await refreshTokenService.issue(userId);

      const res = await request(server)
        .post("/v1/auth/logout")
        .set("Cookie", `${REFRESH_TOKEN_COOKIE_NAME}=${token}`)
        .expect(204);

      expect(res.headers["set-cookie"]?.[0]).toMatch(
        new RegExp(`^${REFRESH_TOKEN_COOKIE_NAME}=;`),
      );
    });
  });

  describe("POST /auth/logout-all", () => {
    it("revokes every refresh token for the current user, not other users'", async () => {
      const userId = await registerTestUser("logout-all-1@tripmind.test");
      const otherUserId = await registerTestUser("logout-all-2@tripmind.test");

      const tokenA1 = await refreshTokenService.issue(userId);
      const tokenA2 = await refreshTokenService.issue(userId);
      const tokenOther = await refreshTokenService.issue(otherUserId);

      const accessToken = await jwtService.signAccessToken(userId);
      await request(server)
        .post("/v1/auth/logout-all")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(204);

      await refreshWithCookie(tokenA1).expect(401);
      await refreshWithCookie(tokenA2).expect(401);
      await refreshWithCookie(tokenOther).expect(200);
    });

    it("rejects without a valid access token (401)", async () => {
      await request(server).post("/v1/auth/logout-all").expect(401);
    });
  });
});
