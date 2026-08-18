import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { importJWK, SignJWT } from "jose";
import request from "supertest";
import type { App } from "supertest/types";
import { JwtService } from "../src/auth/jwt/jwt.service";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/bootstrap/configure-app";
import { ConfigService } from "../src/config/config.service";
import {
  startTestInfrastructure,
  stopTestInfrastructure,
  type TestInfrastructure,
} from "./db-test-helper";

// GET /auth/me là route thật đầu tiên dùng JwtAuthGuard (task #6) — trước đó test
// này nhắm route tạm /auth/whoami-jwt (task #3), đã bị xóa sau khi migrate xong.
describe("JwtAuthGuard (integration, qua GET /auth/me)", () => {
  let app: INestApplication;
  let infra: TestInfrastructure;
  let server: App;
  let configService: ConfigService;
  let jwtService: JwtService;

  beforeAll(async () => {
    infra = await startTestInfrastructure();

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    configService = app.get(ConfigService);
    jwtService = app.get(JwtService);
    configureApp(app, configService);

    // JwtAuthGuard tự fetch JWKS của chính app này qua HTTP thật (offline verify,
    // không mock) — phải thật sự listen ở đúng port configService.port thì mới fetch được.
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

  async function registerTestUser(email: string): Promise<string> {
    const res = await request(server)
      .post("/auth/register")
      .send({ email, password: "password123" })
      .expect(201);
    return res.body.data.user.id as string;
  }

  it("returns 200 + user profile with a valid bearer token", async () => {
    const userId = await registerTestUser("jwt-guard-1@tripmind.test");
    const token = await jwtService.signAccessToken(userId);

    const res = await request(server).get("/auth/me").set("Authorization", `Bearer ${token}`).expect(200);

    expect(res.body.data).toMatchObject({ id: userId, email: "jwt-guard-1@tripmind.test" });
  });

  it("returns 401 without Authorization header", async () => {
    const res = await request(server).get("/auth/me").expect(401);

    expect(res.headers["content-type"]).toMatch(/application\/problem\+json/);
    expect(res.body.category).toBe("business");
  });

  it("returns 401 with an expired token", async () => {
    const privateKey = await importJWK(configService.jwtPrivateJwk, "EdDSA");
    const expiredToken = await new SignJWT({})
      .setProtectedHeader({ alg: "EdDSA", kid: configService.jwtKeyId })
      .setSubject("user-123")
      .setIssuedAt()
      .setExpirationTime(Math.floor(Date.now() / 1000) - 60)
      .sign(privateKey);

    await request(server).get("/auth/me").set("Authorization", `Bearer ${expiredToken}`).expect(401);
  });

  it("returns 401 with a tampered token", async () => {
    const token = await jwtService.signAccessToken("user-123");
    const [header, payload, signature] = token.split(".");
    if (!header || !payload || !signature) {
      throw new Error("Token không đúng format header.payload.signature");
    }
    // Sửa ký tự ĐẦU của signature (6 bit dữ liệu thật trọn vẹn) — không sửa ký tự
    // cuối: byte cuối của chữ ký Ed25519 (64 byte) chỉ có 2 bit dữ liệu + 4 bit đệm
    // luôn-0 trong base64url, đổi sai chỗ đó sẽ không đổi byte giải mã ra.
    const tamperedChar = signature[0] === "A" ? "B" : "A";
    const tamperedToken = `${header}.${payload}.${tamperedChar}${signature.slice(1)}`;

    await request(server).get("/auth/me").set("Authorization", `Bearer ${tamperedToken}`).expect(401);
  });
});
