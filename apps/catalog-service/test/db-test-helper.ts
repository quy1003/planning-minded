import { execSync } from "node:child_process";
import * as path from "node:path";
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";

export type TestInfrastructure = {
  postgres: StartedPostgreSqlContainer;
};

/**
 * Bật Postgres tạm, set process.env, đẩy schema bằng `prisma db push`.
 * Gọi TRƯỚC khi Nest tạo AppModule (ConfigService đọc env lúc construct).
 * catalog-service không dùng Redis.
 */
export async function startTestInfrastructure(): Promise<TestInfrastructure> {
  const postgres = await new PostgreSqlContainer("postgres:17-alpine").start();

  process.env.NODE_ENV = "test";
  process.env.PORT = "3007"; // riêng cho test — tránh đụng dev server thật (3000/3001/3002/3004/3006)
  process.env.DATABASE_URL = postgres.getConnectionUri();

  execSync("pnpm exec prisma db push --skip-generate --accept-data-loss", {
    cwd: path.resolve(__dirname, ".."),
    env: process.env,
    stdio: "inherit",
  });

  return { postgres };
}

export async function stopTestInfrastructure(infra: TestInfrastructure): Promise<void> {
  await infra.postgres.stop();
}
