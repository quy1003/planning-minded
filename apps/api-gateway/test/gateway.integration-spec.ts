import { randomUUID } from "node:crypto";
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import type { App } from "supertest/types";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/bootstrap/configure-app";
import { ConfigService } from "../src/config/config.service";
import { startFakeAuthService, type FakeAuthService } from "./fake-auth-service";
import { startFakeDownstreamService, type FakeDownstreamService } from "./fake-downstream-service";

describe("api-gateway (integration)", () => {
  let app: INestApplication;
  let server: App;
  let fakeJwks: FakeAuthService;
  let fakeAuthTarget: FakeDownstreamService;
  let fakeTripTarget: FakeDownstreamService;
  let fakeCatalogTarget: FakeDownstreamService;
  let fakeApiTarget: FakeDownstreamService;

  beforeAll(async () => {
    // JWKS (cho JwtAuthGuard verify token trên route /trips/*) tách riêng khỏi "service đích"
    // giả lập /auth/* — 2 khái niệm khác nhau dù trong đời thực trùng 1 service (auth-service).
    fakeJwks = await startFakeAuthService(3095);
    fakeAuthTarget = await startFakeDownstreamService(3091);
    fakeTripTarget = await startFakeDownstreamService(3092);
    fakeCatalogTarget = await startFakeDownstreamService(3093);
    fakeApiTarget = await startFakeDownstreamService(3094);

    process.env.NODE_ENV = "test";
    process.env.PORT = "3009";
    process.env.AUTH_SERVICE_URL = fakeJwks.url;
    process.env.AUTH_SERVICE_INTERNAL_URL = fakeAuthTarget.url;
    process.env.TRIP_SERVICE_INTERNAL_URL = fakeTripTarget.url;
    process.env.CATALOG_SERVICE_INTERNAL_URL = fakeCatalogTarget.url;
    process.env.API_INTERNAL_URL = fakeApiTarget.url;

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    const configService = app.get(ConfigService);
    configureApp(app, configService);
    await app.listen(configService.port);
    server = app.getHttpServer() as App;
  }, 120_000);

  afterAll(async () => {
    if (app) await app.close();
    if (fakeJwks) await fakeJwks.close();
    if (fakeAuthTarget) await fakeAuthTarget.close();
    if (fakeTripTarget) await fakeTripTarget.close();
    if (fakeCatalogTarget) await fakeCatalogTarget.close();
    if (fakeApiTarget) await fakeApiTarget.close();
  });

  it("routes /v1/destinations to catalog-service, public — không cần token", async () => {
    fakeCatalogTarget.setResponse(200, { data: [{ id: "d1" }] });

    const res = await request(server).get("/v1/destinations?region=Test").expect(200);

    expect(res.body).toEqual({ data: [{ id: "d1" }] });
    expect(fakeCatalogTarget.getLastRequest()).toMatchObject({
      method: "GET",
      url: "/v1/destinations?region=Test",
    });
  });

  it("routes /v1/auth/* to auth-service kể cả không có token (mixed access, để service tự quyết)", async () => {
    fakeAuthTarget.setResponse(200, { data: { accessToken: "fake" } }, {
      "set-cookie": ["tripmind.rt=abc123; HttpOnly; Path=/api/v1/auth"],
    });

    const res = await request(server)
      .post("/v1/auth/login")
      .send({ email: "a@a.com", password: "password123" })
      .expect(200);

    expect(res.body).toEqual({ data: { accessToken: "fake" } });
    // Set-Cookie phải tới được browser — đây là chỗ dễ bug nhất nếu quên forward header.
    expect(res.headers["set-cookie"]?.[0]).toMatch(/^tripmind\.rt=abc123/);

    const lastRequest = fakeAuthTarget.getLastRequest();
    expect(lastRequest?.method).toBe("POST");
    expect(JSON.parse(lastRequest?.body ?? "{}")).toEqual({ email: "a@a.com", password: "password123" });
  });

  it("chặn /v1/trips/* ở GATEWAY khi thiếu token — request KHÔNG chạm tới trip-service", async () => {
    const res = await request(server).get("/v1/trips").expect(401);

    expect(res.body.category).toBe("business");
    expect(fakeTripTarget.getLastRequest()).toBeNull();
  });

  it("cho qua /v1/trips/* khi có token hợp lệ, forward đúng Authorization header", async () => {
    fakeTripTarget.setResponse(200, { data: [] });
    const accessToken = await fakeJwks.signAccessToken(randomUUID(), "USER");

    await request(server).get("/v1/trips").set("Authorization", `Bearer ${accessToken}`).expect(200);

    expect(fakeTripTarget.getLastRequest()?.headers.authorization).toBe(`Bearer ${accessToken}`);
  });

  it("route còn lại (không khớp auth/trips/destinations) fallback sang apps/api", async () => {
    fakeApiTarget.setResponse(200, { status: "ok" });

    await request(server).get("/v1/health-check-something").expect(200);

    expect(fakeApiTarget.getLastRequest()).toMatchObject({ method: "GET", url: "/v1/health-check-something" });
  });

  it("trả 503 problem+json khi service đích không phản hồi được", async () => {
    await fakeCatalogTarget.close();

    const res = await request(server).get("/v1/destinations").expect(503);

    expect(res.headers["content-type"]).toMatch(/application\/problem\+json/);
    expect(res.body.category).toBe("system");

    // Mở lại cho các test khác (afterAll sẽ close lần nữa, .close() gọi 2 lần vô hại vì
    // http.Server#close chỉ lỗi khi server CHƯA từng listen, không phải khi đã close rồi — nhưng
    // để an toàn, tạo server mới thay vì tái dùng biến đã đóng).
    fakeCatalogTarget = await startFakeDownstreamService(3093);
  });
});
