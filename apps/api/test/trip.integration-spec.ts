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

describe("Trip (integration)", () => {
  let app: INestApplication;
  let infra: TestInfrastructure;
  let server: App;
  let accessToken: string;

  // TripController giờ dùng JwtAuthGuard (task #6) — mọi request phải tự gắn
  // Authorization: Bearer, không còn tự động qua cookie session như trước.
  function authed(method: "get" | "post" | "patch" | "delete", path: string): request.Test {
    return request(server)[method](path).set("Authorization", `Bearer ${accessToken}`);
  }

  beforeAll(async () => {
    infra = await startTestInfrastructure();
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    const configService = app.get(ConfigService);
    configureApp(app, configService);
    // JwtAuthGuard (TripController) tự fetch JWKS của chính app này qua HTTP thật —
    // phải thật sự listen ở đúng port configService.port thì mới fetch được.
    await app.listen(configService.port);
    server = app.getHttpServer() as App;

    await request(server)
      .post("/auth/register")
      .send({ email: "tripper@tripmind.test", password: "password123", name: "Tripper" })
      .expect(201);
    const login = await request(server)
      .post("/auth/login")
      .send({ email: "tripper@tripmind.test", password: "password123" })
      .expect(200);
    accessToken = login.body.data.accessToken as string;
  }, 120_000);

  afterAll(async () => {
    if (app) await app.close();
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
