import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import type { App } from "supertest/types";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/bootstrap/configure-app";
import { ConfigService } from "../src/config/config.service";
import { RedisService } from "../src/redis/redis.service";
import {
  startTestInfrastructure,
  stopTestInfrastructure,
  type TestInfrastructure,
} from "./db-test-helper";

describe("POST /auth/login rate limit (integration)", () => {
  let app: INestApplication;
  let infra: TestInfrastructure;
  let server: App;
  let redisService: RedisService;

  beforeAll(async () => {
    infra = await startTestInfrastructure();
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    redisService = app.get(RedisService);
    configureApp(app, app.get(ConfigService));
    await app.init();
    server = app.getHttpServer() as App;
  }, 120_000);

  afterAll(async () => {
    if (app) await app.close();
    if (infra) await stopTestInfrastructure(infra);
  });

  beforeEach(async () => {
    // Mỗi test độc lập — mọi request trong cùng file đi từ 1 IP (supertest),
    // không xóa thì bộ đếm IP sẽ cộng dồn xuyên các test.
    await redisService.client.flushDb();
  });

  it("cho qua 5 lần sai đầu (401), chặn 429 từ lần thứ 6 trong cùng email", async () => {
    const email = "brute-force-target@tripmind.test";

    for (let i = 0; i < 5; i++) {
      const res = await request(server).post("/auth/login").send({ email, password: "sai-password" });
      expect(res.status).toBe(401);
    }

    const res = await request(server).post("/auth/login").send({ email, password: "sai-password" });
    expect(res.status).toBe(429);
    expect(res.body.category).toBe("business");
  });

  it("chặn theo IP dù đổi email khác nhau mỗi lần (ngưỡng 20)", async () => {
    for (let i = 0; i < 20; i++) {
      const res = await request(server)
        .post("/auth/login")
        .send({ email: `attacker-${i}@tripmind.test`, password: "sai-password" });
      expect(res.status).toBe(401);
    }

    const res = await request(server)
      .post("/auth/login")
      .send({ email: "attacker-final@tripmind.test", password: "sai-password" });
    expect(res.status).toBe(429);
  }, 20_000);

  it("login đúng password vẫn tính vào bộ đếm — đúng trade-off 'đếm mọi lần thử' đã chọn", async () => {
    const email = "legit-user@tripmind.test";
    const password = "password123";
    await request(server).post("/auth/register").send({ email, password }).expect(201);

    for (let i = 0; i < 5; i++) {
      const res = await request(server).post("/auth/login").send({ email, password });
      expect(res.status).toBe(200);
    }

    const res = await request(server).post("/auth/login").send({ email, password });
    expect(res.status).toBe(429);
  });
});
