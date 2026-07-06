import * as path from "node:path";
import * as dotenv from "dotenv";

// Phải chạy TRƯỚC mọi import khác đọc process.env. Turborepo/pnpm chạy script này với
// cwd = apps/api, nên .env ở repo root không tự được tìm thấy — phải trỏ path rõ ràng.
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { RedisStore } from "connect-redis";
import { AppModule } from "./app.module";
import { ConfigService } from "./config/config.service";
import { RedisService } from "./redis/redis.service";
import { configureApp } from "./bootstrap/configure-app";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const redisClient = app.get(RedisService).client;
  const sessionStore = new RedisStore({ client: redisClient });

  configureApp(app, configService, sessionStore);

  await app.listen(configService.port);
}

void bootstrap();
