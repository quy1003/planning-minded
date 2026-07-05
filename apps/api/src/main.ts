import * as path from "node:path";
import * as dotenv from "dotenv";

// Phải chạy TRƯỚC mọi import khác đọc process.env. Turborepo/pnpm chạy script này với
// cwd = apps/api, nên .env ở repo root không tự được tìm thấy — phải trỏ path rõ ràng.
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ConfigService } from "./config/config.service";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  await app.listen(configService.port);
}

void bootstrap();
