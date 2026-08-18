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

describe("Trip (integration)", () => {
  let app: INestApplication;
  let infra: TestInfrastructure;
  let fakeAuthService: FakeAuthService;
  let server: App;
  let accessToken: string;

  // TripController dùng JwtAuthGuard — mọi request phải tự gắn Authorization: Bearer.
  function authed(method: "get" | "post" | "patch" | "delete", path: string): request.Test {
    return request(server)[method](path).set("Authorization", `Bearer ${accessToken}`);
  }

  beforeAll(async () => {
    infra = await startTestInfrastructure();

    // apps/api không còn tự ký/serve JWKS (task #7 — auth-service giữ hết) — JwtAuthGuard
    // vẫn fetch JWKS qua HTTP thật, nên cần 1 "auth-service giả" phục vụ đúng vai trò đó.
    // Phải set AUTH_SERVICE_URL TRƯỚC khi Nest tạo ConfigService (đọc process.env lúc construct).
    fakeAuthService = await startFakeAuthService(3098);
    process.env.AUTH_SERVICE_URL = fakeAuthService.url;

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    const configService = app.get(ConfigService);
    configureApp(app, configService);
    await app.listen(configService.port);
    server = app.getHttpServer() as App;

    accessToken = await fakeAuthService.signAccessToken(randomUUID());
  }, 120_000);

  afterAll(async () => {
    if (app) await app.close();
    if (fakeAuthService) await fakeAuthService.close();
    if (infra) await stopTestInfrastructure(infra);
  });

  it("CRUD trip + place + itinerary with ownership envelope", async () => {
    const created = await authed("post", "/trips")
      .send({
        title: "Đà Lạt",
        destinationName: "Đà Lạt",
        days: 3,
        partySize: 2,
        budget: "5000000",
      })
      .expect(201);

    expect(created.body.data).toMatchObject({
      title: "Đà Lạt",
      destinationName: "Đà Lạt",
      days: 3,
      budget: "5000000",
    });
    const tripId = created.body.data.id as string;

    const place = await authed("post", `/trips/${tripId}/places`)
      .send({ name: "Hồ Xuân Hương", lat: 11.94, lng: 108.45 })
      .expect(201);
    expect(place.body.data).toMatchObject({ name: "Hồ Xuân Hương" });
    const placeId = place.body.data.id as string;

    const place2 = await authed("post", `/trips/${tripId}/places`)
      .send({ name: "Chợ Đà Lạt", lat: 11.941, lng: 108.438 })
      .expect(201);
    const place2Id = place2.body.data.id as string;

    const item = await authed("post", `/trips/${tripId}/itinerary`)
      .send({
        placeId,
        dayNumber: 1,
        slot: "MORNING",
        visitOrder: 1,
        title: "Thăm hồ",
        startTime: "08:00",
      })
      .expect(201);
    expect(item.body.data).toMatchObject({
      title: "Thăm hồ",
      slot: "MORNING",
      visitOrder: 1,
      startTime: "08:00:00",
    });
    const itemId = item.body.data.id as string;

    await authed("post", `/trips/${tripId}/itinerary`)
      .send({
        placeId: place2Id,
        dayNumber: 1,
        slot: "MORNING",
        visitOrder: 1,
        title: "Trùng order",
      })
      .expect(409);

    const item2 = await authed("post", `/trips/${tripId}/itinerary`)
      .send({
        placeId: place2Id,
        dayNumber: 1,
        slot: "MORNING",
        visitOrder: 2,
        title: "Chợ",
      })
      .expect(201);

    const reordered = await authed("patch", `/trips/${tripId}/itinerary/reorder`)
      .send([
        { itemId, dayNumber: 1, slot: "MORNING", visitOrder: 2 },
        { itemId: item2.body.data.id, dayNumber: 1, slot: "MORNING", visitOrder: 1 },
      ])
      .expect(200);
    expect(reordered.body.data.map((row: { title: string }) => row.title)).toEqual([
      "Chợ",
      "Thăm hồ",
    ]);

    const list = await authed("get", `/trips/${tripId}/itinerary`).expect(200);
    expect(list.body.data).toHaveLength(2);

    await authed("delete", `/trips/${tripId}/places/${placeId}`).expect(409);

    await authed("delete", `/trips/${tripId}/itinerary/${itemId}`).expect(204);
    await authed("delete", `/trips/${tripId}/itinerary/${item2.body.data.id as string}`).expect(204);
    await authed("delete", `/trips/${tripId}/places/${placeId}`).expect(204);

    const detail = await authed("get", `/trips/${tripId}`).expect(200);
    expect(detail.body.data.places).toHaveLength(1);

    await authed("delete", `/trips/${tripId}`).expect(204);
    await authed("get", `/trips/${tripId}`).expect(404);
  });

  it("rejects unauthenticated trip list", async () => {
    const res = await request(server).get("/trips").expect(401);
    expect(res.body.category).toBe("business");
  });
});
