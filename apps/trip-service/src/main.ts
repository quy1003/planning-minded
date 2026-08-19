import * as path from "node:path";
import * as dotenv from "dotenv";

// Phải chạy TRƯỚC mọi import khác đọc process.env. Turborepo/pnpm chạy script này với
// cwd = apps/trip-service, nên .env ở repo root không tự được tìm thấy — phải trỏ path rõ ràng.
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ConfigService } from "./config/config.service";
import { configureApp } from "./bootstrap/configure-app";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  configureApp(app, configService);

  await app.listen(configService.port);
}

void bootstrap();
