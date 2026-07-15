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
    // Không truyền RedisStore → MemoryStore (đủ cho test; Redis vẫn chạy cho RedisService boot).
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

  it("registers a new user without leaking passwordHash", async () => {
    const res = await request(server)
      .post("/auth/register")
      .send({ email: "new@tripmind.test", password: "password123", name: "New" })
      .expect(201);

    expect(res.body).toEqual({
      data: expect.objectContaining({
        email: "new@tripmind.test",
        name: "New",
        id: expect.any(String),
      }),
    });
    expect(res.body.data).not.toHaveProperty("passwordHash");
  });

  it("rejects duplicate email with business problem+json 409", async () => {
    await request(server)
      .post("/auth/register")
      .send({ email: "dup@tripmind.test", password: "password123" })
      .expect(201);

    const res = await request(server)
      .post("/auth/register")
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
      .post("/auth/register")
      .send({ password: "123" })
      .expect(400);

    expect(res.headers["content-type"]).toMatch(/application\/problem\+json/);
    expect(res.body.category).toBe("business");
    expect(res.body.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: expect.any(String) })]),
    );
  });

  it("login → me → logout → me blocked (cookie session)", async () => {
    const email = "flow@tripmind.test";
    const password = "password123";

    await request(server).post("/auth/register").send({ email, password }).expect(201);

    const agent = request.agent(server);

    const login = await agent.post("/auth/login").send({ email, password }).expect(200);
    expect(login.body.data).toMatchObject({ email });
    expect(login.headers["set-cookie"]).toBeDefined();

    const me = await agent.get("/auth/me").expect(200);
    expect(me.body.data).toMatchObject({ email });
    expect(me.body.data).not.toHaveProperty("passwordHash");

    await agent.post("/auth/logout").expect(204);

    const meAfter = await agent.get("/auth/me").expect(401);
    expect(meAfter.headers["content-type"]).toMatch(/application\/problem\+json/);
    expect(meAfter.body.category).toBe("business");
  });

  it("rejects bad login credentials with business 401", async () => {
    await request(server)
      .post("/auth/register")
      .send({ email: "badlogin@tripmind.test", password: "password123" })
      .expect(201);

    const res = await request(server)
      .post("/auth/login")
      .send({ email: "badlogin@tripmind.test", password: "wrong-password" })
      .expect(401);

    expect(res.headers["content-type"]).toMatch(/application\/problem\+json/);
    expect(res.body.category).toBe("business");
  });
});
