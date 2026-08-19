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

describe("POST /auth/refresh (integration)", () => {
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
    refreshTokenService = app.get(RefreshTokenService);
    jwtService = app.get(JwtService);
    configureApp(app, app.get(ConfigService));
    await app.init();
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

  // RefreshToken.userId có FK thật vào bảng users (ADR 006) — phải có user thật
  // trong DB trước khi issue() token cho userId đó.
  async function registerTestUser(email: string): Promise<string> {
    const res = await request(server)
      .post("/v1/auth/register")
      .send({ email, password: "password123" })
      .expect(201);
    return res.body.data.user.id as string;
  }

  // Task #6: refresh token đọc từ cookie httpOnly, KHÔNG còn nhận qua body.
  function withRefreshCookie(token: string) {
    return request(server).post("/v1/auth/refresh").set("Cookie", `${REFRESH_TOKEN_COOKIE_NAME}=${token}`);
  }

  it("rotates a valid refresh token — returns new access token + sets new refresh cookie", async () => {
    const userId = await registerTestUser("refresh-flow-1@tripmind.test");
    const oldRefreshToken = await refreshTokenService.issue(userId);

    const res = await withRefreshCookie(oldRefreshToken).expect(200);

    expect(res.body).toEqual({ data: { accessToken: expect.any(String) } });
    expect(res.headers["set-cookie"]?.[0]).toMatch(
      new RegExp(`^${REFRESH_TOKEN_COOKIE_NAME}=.+HttpOnly`),
    );
    const newCookieHeader = res.headers["set-cookie"][0] as string;
    const newToken = newCookieHeader.split(";")[0].split("=")[1];
    expect(newToken).not.toBe(oldRefreshToken);

    const claims = await jwtService.verifyAccessToken(res.body.data.accessToken as string);
    expect(claims.sub).toBe(userId);
  });

  it("rejects reusing an already-rotated refresh token (401)", async () => {
    const userId = await registerTestUser("refresh-flow-2@tripmind.test");
    const oldRefreshToken = await refreshTokenService.issue(userId);

    await withRefreshCookie(oldRefreshToken).expect(200);

    const res = await withRefreshCookie(oldRefreshToken).expect(401);

    expect(res.headers["content-type"]).toMatch(/application\/problem\+json/);
    expect(res.body.category).toBe("business");
  });

  it("rejects a refresh token that never existed (401)", async () => {
    await withRefreshCookie("not-a-real-token").expect(401);
  });

  it("rejects when there is no refresh token cookie at all (401)", async () => {
    const res = await request(server).post("/v1/auth/refresh").expect(401);

    expect(res.body.category).toBe("business");
  });
});
