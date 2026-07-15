import { execSync } from "node:child_process";
import * as path from "node:path";
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { RedisContainer, type StartedRedisContainer } from "@testcontainers/redis";

export type TestInfrastructure = {
  postgres: StartedPostgreSqlContainer;
  redis: StartedRedisContainer;
};

/**
 * Bật Postgres + Redis tạm, set process.env, đẩy schema bằng `prisma db push`.
 * Gọi TRƯỚC khi Nest tạo AppModule (ConfigService đọc env lúc construct).
 */
export async function startTestInfrastructure(): Promise<TestInfrastructure> {
  const [postgres, redis] = await Promise.all([
    new PostgreSqlContainer("postgres:17-alpine").start(),
    new RedisContainer("redis:7-alpine").start(),
  ]);

  process.env.NODE_ENV = "test";
  process.env.PORT = "3001";
  process.env.DATABASE_URL = postgres.getConnectionUri();
  process.env.REDIS_URL = redis.getConnectionUrl();
  process.env.SESSION_SECRET = "test-session-secret-16";

  execSync("pnpm exec prisma db push --skip-generate --accept-data-loss", {
    cwd: path.resolve(__dirname, ".."),
    env: process.env,
    stdio: "inherit",
  });

  return { postgres, redis };
}

export async function stopTestInfrastructure(infra: TestInfrastructure): Promise<void> {
  await Promise.all([infra.postgres.stop(), infra.redis.stop()]);
}
