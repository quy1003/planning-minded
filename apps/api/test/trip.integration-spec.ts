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

  it("CRUD trip + place with ownership envelope", async () => {
    const created = await agent
      .post("/trips")
      .send({
        title: "Đà Lạt",
        destinationName: "Đà Lạt",
        days: 3,
        partySize: 2,
        budget: 5_000_000,
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
