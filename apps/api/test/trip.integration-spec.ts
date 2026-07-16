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
  let agent: request.SuperAgentTest;

  beforeAll(async () => {
    infra = await startTestInfrastructure();
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app, app.get(ConfigService));
    await app.init();
    server = app.getHttpServer() as App;

    agent = request.agent(server);
    await agent
      .post("/auth/register")
      .send({ email: "tripper@tripmind.test", password: "password123", name: "Tripper" })
      .expect(201);
    await agent
      .post("/auth/login")
      .send({ email: "tripper@tripmind.test", password: "password123" })
      .expect(200);
  }, 120_000);

  afterAll(async () => {
    if (app) await app.close();
    if (infra) await stopTestInfrastructure(infra);
  });

  it("CRUD trip + place + itinerary with ownership envelope", async () => {
    const created = await agent
      .post("/trips")
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

    const place = await agent
      .post(`/trips/${tripId}/places`)
      .send({ name: "Hồ Xuân Hương", lat: 11.94, lng: 108.45 })
      .expect(201);
    expect(place.body.data).toMatchObject({ name: "Hồ Xuân Hương" });
    const placeId = place.body.data.id as string;

    const place2 = await agent
      .post(`/trips/${tripId}/places`)
      .send({ name: "Chợ Đà Lạt", lat: 11.941, lng: 108.438 })
      .expect(201);
    const place2Id = place2.body.data.id as string;

    const item = await agent
      .post(`/trips/${tripId}/itinerary`)
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

    await agent
      .post(`/trips/${tripId}/itinerary`)
      .send({
        placeId: place2Id,
        dayNumber: 1,
        slot: "MORNING",
        visitOrder: 1,
        title: "Trùng order",
      })
      .expect(409);

    const item2 = await agent
      .post(`/trips/${tripId}/itinerary`)
      .send({
        placeId: place2Id,
        dayNumber: 1,
        slot: "MORNING",
        visitOrder: 2,
        title: "Chợ",
      })
      .expect(201);

    const reordered = await agent
      .patch(`/trips/${tripId}/itinerary/reorder`)
      .send([
        { itemId, dayNumber: 1, slot: "MORNING", visitOrder: 2 },
        { itemId: item2.body.data.id, dayNumber: 1, slot: "MORNING", visitOrder: 1 },
      ])
      .expect(200);
    expect(reordered.body.data.map((row: { title: string }) => row.title)).toEqual([
      "Chợ",
      "Thăm hồ",
    ]);

    const list = await agent.get(`/trips/${tripId}/itinerary`).expect(200);
    expect(list.body.data).toHaveLength(2);

    await agent.delete(`/trips/${tripId}/places/${placeId}`).expect(409);

    await agent.delete(`/trips/${tripId}/itinerary/${itemId}`).expect(204);
    await agent.delete(`/trips/${tripId}/itinerary/${item2.body.data.id as string}`).expect(204);
    await agent.delete(`/trips/${tripId}/places/${placeId}`).expect(204);

    const detail = await agent.get(`/trips/${tripId}`).expect(200);
    expect(detail.body.data.places).toHaveLength(1);

    await agent.delete(`/trips/${tripId}`).expect(204);
    await agent.get(`/trips/${tripId}`).expect(404);
  });

  it("rejects unauthenticated trip list", async () => {
    const res = await request(server).get("/trips").expect(401);
    expect(res.body.category).toBe("business");
  });
});
