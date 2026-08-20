import { randomUUID } from "node:crypto";
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
import { startFakeAuthService, type FakeAuthService } from "./fake-auth-service";

describe("Catalog (integration)", () => {
  let app: INestApplication;
  let infra: TestInfrastructure;
  let fakeAuthService: FakeAuthService;
  let server: App;
  let adminToken: string;
  let userToken: string;

  function asAdmin(method: "get" | "post" | "patch" | "delete", path: string): request.Test {
    return request(server)[method](path).set("Authorization", `Bearer ${adminToken}`);
  }

  function asUser(method: "get" | "post" | "patch" | "delete", path: string): request.Test {
    return request(server)[method](path).set("Authorization", `Bearer ${userToken}`);
  }

  beforeAll(async () => {
    infra = await startTestInfrastructure();

    // catalog-service không tự ký/serve JWKS — JwtAuthGuard vẫn fetch JWKS qua HTTP thật,
    // nên cần 1 "auth-service giả" phục vụ đúng vai trò đó (giống trip-service).
    fakeAuthService = await startFakeAuthService(3099);
    process.env.AUTH_SERVICE_URL = fakeAuthService.url;

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    const configService = app.get(ConfigService);
    configureApp(app, configService);
    await app.listen(configService.port);
    server = app.getHttpServer() as App;

    adminToken = await fakeAuthService.signAccessToken(randomUUID(), "ADMIN");
    userToken = await fakeAuthService.signAccessToken(randomUUID(), "USER");
  }, 120_000);

  afterAll(async () => {
    if (app) await app.close();
    if (fakeAuthService) await fakeAuthService.close();
    if (infra) await stopTestInfrastructure(infra);
  });

  it("public GET /destinations works without a token", async () => {
    const res = await request(server).get("/v1/destinations").expect(200);
    expect(res.body.data).toEqual([]);
  });

  it("rejects create without admin role (403), allows with admin role (201)", async () => {
    await asUser("post", "/v1/destinations")
      .send({
        name: "Đà Nẵng",
        region: "Duyên hải Nam Trung Bộ",
        description: "Thành phố biển miền Trung.",
        lat: 16.047,
        lng: 108.206,
      })
      .expect(403);

    const created = await asAdmin("post", "/v1/destinations")
      .send({
        name: "Đà Nẵng",
        region: "Duyên hải Nam Trung Bộ",
        description: "Thành phố biển miền Trung.",
        lat: 16.047,
        lng: 108.206,
        tags: ["biển"],
      })
      .expect(201);
    expect(created.body.data).toMatchObject({ name: "Đà Nẵng", tags: ["biển"] });
  });

  it("rejects unauthenticated create (401)", async () => {
    const res = await request(server)
      .post("/v1/destinations")
      .send({ name: "X", region: "Y", description: "Z", lat: 0, lng: 0 })
      .expect(401);
    expect(res.body.category).toBe("business");
  });

  it("CRUD destination + nested poi (admin), public read, then not-found after delete", async () => {
    const destination = await asAdmin("post", "/v1/destinations")
      .send({
        name: "Hội An (test)",
        region: "Duyên hải Nam Trung Bộ",
        description: "Phố cổ.",
        lat: 15.88,
        lng: 108.326,
      })
      .expect(201);
    const destinationId = destination.body.data.id as string;

    const poi = await asAdmin("post", `/v1/destinations/${destinationId}/pois`)
      .send({
        name: "Chùa Cầu",
        lat: 15.879,
        lng: 108.327,
        category: "sightseeing",
        description: "Biểu tượng Hội An.",
        estCostMin: "0",
        estCostMax: "80000",
        avgDurationMin: 30,
      })
      .expect(201);
    expect(poi.body.data).toMatchObject({ name: "Chùa Cầu", destinationId });
    const poiId = poi.body.data.id as string;

    // public read — không cần token
    const list = await request(server).get(`/v1/destinations/${destinationId}/pois`).expect(200);
    expect(list.body.data).toHaveLength(1);

    await asAdmin("patch", `/v1/destinations/${destinationId}/pois/${poiId}`)
      .send({ description: "Cập nhật mô tả." })
      .expect(200);

    await asUser("delete", `/v1/destinations/${destinationId}/pois/${poiId}`).expect(403);
    await asAdmin("delete", `/v1/destinations/${destinationId}/pois/${poiId}`).expect(204);

    await asAdmin("delete", `/v1/destinations/${destinationId}`).expect(204);
    await request(server).get(`/v1/destinations/${destinationId}`).expect(404);
  });

  it("rejects duplicate destination name (409)", async () => {
    await asAdmin("post", "/v1/destinations")
      .send({ name: "Sa Pa (test)", region: "Tây Bắc", description: "Vùng núi.", lat: 22.33, lng: 103.84 })
      .expect(201);

    const res = await asAdmin("post", "/v1/destinations")
      .send({ name: "Sa Pa (test)", region: "Tây Bắc", description: "Trùng tên.", lat: 22.33, lng: 103.84 })
      .expect(409);
    expect(res.body.category).toBe("business");
  });

  it("filters by region and tags", async () => {
    await asAdmin("post", "/v1/destinations")
      .send({
        name: "Phú Quốc (test)",
        region: "Đồng bằng sông Cửu Long",
        description: "Đảo ngọc.",
        lat: 10.29,
        lng: 103.98,
        tags: ["biển", "đảo"],
      })
      .expect(201);

    const byRegion = await request(server)
      .get("/v1/destinations?region=" + encodeURIComponent("Đồng bằng sông Cửu Long"))
      .expect(200);
    expect(byRegion.body.data).toHaveLength(1);
    expect(byRegion.body.data[0]).toMatchObject({ name: "Phú Quốc (test)" });

    const byTag = await request(server).get("/v1/destinations?tags=đảo").expect(200);
    expect(byTag.body.data.map((d: { name: string }) => d.name)).toContain("Phú Quốc (test)");
  });
});
