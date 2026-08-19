import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import type { App } from "supertest/types";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/bootstrap/configure-app";
import { ConfigService } from "../src/config/config.service";
import {
  startTestInfrastructure,
  stopTestInfrastructure,
  type TestInfrastructure,
} from "./db-test-helper";

describe("Auth (integration)", () => {
  let app: INestApplication;
  let infra: TestInfrastructure;
  let server: App;

  beforeAll(async () => {
    infra = await startTestInfrastructure();

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    const configService = app.get(ConfigService);
    configureApp(app, configService);
    // /auth/me dùng JwtAuthGuard — tự fetch JWKS của chính app này qua HTTP thật,
    // phải thật sự listen ở đúng port configService.port thì mới fetch được.
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

  it("registers a new user, auto-issues tokens, without leaking passwordHash", async () => {
    const res = await request(server)
      .post("/v1/auth/register")
      .send({ email: "new@tripmind.test", password: "password123", name: "New" })
      .expect(201);

    expect(res.body).toEqual({
      data: {
        accessToken: expect.any(String),
        user: expect.objectContaining({
          email: "new@tripmind.test",
          name: "New",
          id: expect.any(String),
        }),
      },
    });
    expect(res.body.data.user).not.toHaveProperty("passwordHash");
    expect(res.headers["set-cookie"]?.[0]).toMatch(/^tripmind\.rt=.+HttpOnly/);
  });

  it("rejects duplicate email with business problem+json 409", async () => {
    await request(server)
      .post("/v1/auth/register")
      .send({ email: "dup@tripmind.test", password: "password123" })
      .expect(201);

    const res = await request(server)
      .post("/v1/auth/register")
      .send({ email: "dup@tripmind.test", password: "password123" })
      .expect(409);

    expect(res.headers["content-type"]).toMatch(/application\/problem\+json/);
    expect(res.body).toMatchObject({
      status: 409,
      detail: "Email already registered",
      category: "business",
    });
  });

  it("rejects invalid register body with business 400 + errors", async () => {
    const res = await request(server)
      .post("/v1/auth/register")
      .send({ password: "123" })
      .expect(400);

    expect(res.headers["content-type"]).toMatch(/application\/problem\+json/);
    expect(res.body.category).toBe("business");
    expect(res.body.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: expect.any(String) })]),
    );
  });

  it("login → me (Bearer) → refresh (cookie) → logout → refresh with old cookie fails", async () => {
    const email = "flow@tripmind.test";
    const password = "password123";
    await request(server).post("/v1/auth/register").send({ email, password }).expect(201);

    // agent giữ cookie jar tự động — refresh token cookie (httpOnly) sẽ tự đi kèm
    // các request tiếp theo qua CÙNG agent, giống hệt browser thật.
    const agent = request.agent(server);
    const login = await agent.post("/v1/auth/login").send({ email, password }).expect(200);
    const accessToken = login.body.data.accessToken as string;
    expect(login.body.data.user).toMatchObject({ email });
    expect(login.headers["set-cookie"]?.[0]).toMatch(/^tripmind\.rt=/);

    const me = await request(server)
      .get("/v1/auth/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);
    expect(me.body.data).toMatchObject({ email });
    expect(me.body.data).not.toHaveProperty("passwordHash");

    const refresh = await agent.post("/v1/auth/refresh").expect(200);
    expect(refresh.body.data).toEqual({ accessToken: expect.any(String) });
    expect(refresh.body.data).not.toHaveProperty("refreshToken"); // không lộ raw token qua body

    await agent.post("/v1/auth/logout").expect(204);

    // Cookie cũ (đã bị rotate ở bước refresh rồi revoke ở logout) không dùng lại được.
    const refreshAfterLogout = await agent.post("/v1/auth/refresh").expect(401);
    expect(refreshAfterLogout.body.category).toBe("business");
  });

  it("access token vẫn hợp lệ sau logout tới khi tự hết hạn (15 phút) — logout chỉ thu hồi refresh token", async () => {
    const email = "logout-access-token@tripmind.test";
    const password = "password123";
    await request(server).post("/v1/auth/register").send({ email, password }).expect(201);

    const agent = request.agent(server);
    const login = await agent.post("/v1/auth/login").send({ email, password }).expect(200);
    const accessToken = login.body.data.accessToken as string;

    await agent.post("/v1/auth/logout").expect(204);

    // Đúng như ADR 006 nêu — chưa có cơ chế "kill access token còn hạn ngay lập tức".
    await request(server).get("/v1/auth/me").set("Authorization", `Bearer ${accessToken}`).expect(200);
  });

  it("rejects bad login credentials with business 401", async () => {
    await request(server)
      .post("/v1/auth/register")
      .send({ email: "badlogin@tripmind.test", password: "password123" })
      .expect(201);

    const res = await request(server)
      .post("/v1/auth/login")
      .send({ email: "badlogin@tripmind.test", password: "wrong-password" })
      .expect(401);

    expect(res.headers["content-type"]).toMatch(/application\/problem\+json/);
    expect(res.body.category).toBe("business");
  });
});
