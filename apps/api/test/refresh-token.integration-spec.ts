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

  // RefreshToken.userId giờ có FK thật vào bảng users (ADR 006) — phải có user thật
  // trong DB trước khi issue() token cho userId đó, không dùng chuỗi giả được nữa.
  async function registerTestUser(email: string): Promise<string> {
    const res = await request(server)
      .post("/auth/register")
      .send({ email, password: "password123" })
      .expect(201);
    return res.body.data.id as string;
  }

  it("rotates a valid refresh token into a new access + refresh token pair", async () => {
    const userId = await registerTestUser("refresh-flow-1@tripmind.test");
    const oldRefreshToken = await refreshTokenService.issue(userId);

    const res = await request(server)
      .post("/auth/refresh")
      .send({ refreshToken: oldRefreshToken })
      .expect(200);

    expect(res.body.data.accessToken).toEqual(expect.any(String));
    expect(res.body.data.refreshToken).toEqual(expect.any(String));
    expect(res.body.data.refreshToken).not.toBe(oldRefreshToken);

    const claims = await jwtService.verifyAccessToken(res.body.data.accessToken);
    expect(claims.sub).toBe(userId);
  });

  it("rejects reusing an already-rotated refresh token (401)", async () => {
    const userId = await registerTestUser("refresh-flow-2@tripmind.test");
    const oldRefreshToken = await refreshTokenService.issue(userId);

    await request(server).post("/auth/refresh").send({ refreshToken: oldRefreshToken }).expect(200);

    const res = await request(server)
      .post("/auth/refresh")
      .send({ refreshToken: oldRefreshToken })
      .expect(401);

    expect(res.headers["content-type"]).toMatch(/application\/problem\+json/);
    expect(res.body.category).toBe("business");
  });

  it("rejects a refresh token that never existed (401)", async () => {
    await request(server)
      .post("/auth/refresh")
      .send({ refreshToken: "not-a-real-token" })
      .expect(401);
  });

  it("rejects missing refreshToken in body (400)", async () => {
    const res = await request(server).post("/auth/refresh").send({}).expect(400);

    expect(res.body.category).toBe("business");
  });
});
