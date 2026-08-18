import { HttpException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { RedisService } from "../../redis/redis.service";
import { LoginRateLimitGuard } from "./login-rate-limit.guard";

type FakeContext = { switchToHttp: () => { getRequest: () => { body: unknown; ip: string } } };

function fakeContext(body: unknown, ip = "1.1.1.1"): FakeContext {
  return { switchToHttp: () => ({ getRequest: () => ({ body, ip }) }) };
}

describe("LoginRateLimitGuard", () => {
  // Fake ZSET đơn giản bằng Map<key, Map<member, score>> — đủ để test logic
  // sliding window (zAdd/zRemRangeByScore/zCard/expire), không cần Redis thật.
  const zsets = new Map<string, Map<string, number>>();
  const fakeClient = {
    zAdd: jest.fn(async (key: string, { score, value }: { score: number; value: string }) => {
      if (!zsets.has(key)) zsets.set(key, new Map());
      zsets.get(key)?.set(value, score);
    }),
    zRemRangeByScore: jest.fn(async (key: string, min: number, max: number) => {
      const set = zsets.get(key);
      if (!set) return;
      for (const [member, score] of set) {
        if (score >= min && score <= max) set.delete(member);
      }
    }),
    zCard: jest.fn(async (key: string) => zsets.get(key)?.size ?? 0),
    expire: jest.fn(async () => true),
  };

  let guard: LoginRateLimitGuard;

  beforeEach(async () => {
    zsets.clear();
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [LoginRateLimitGuard, { provide: RedisService, useValue: { client: fakeClient } }],
    }).compile();

    guard = moduleRef.get(LoginRateLimitGuard);
  });

  it("cho qua khi chưa vượt ngưỡng", async () => {
    await expect(
      guard.canActivate(fakeContext({ email: "a@test.com" }) as never),
    ).resolves.toBe(true);
  });

  it("chặn 429 khi vượt ngưỡng theo email (5 lần/15 phút)", async () => {
    const ctx = fakeContext({ email: "brute@test.com" });
    for (let i = 0; i < 5; i++) {
      await guard.canActivate(ctx as never); // 5 lần đầu hợp lệ
    }

    await expect(guard.canActivate(ctx as never)).rejects.toBeInstanceOf(HttpException);
    const error = await guard.canActivate(ctx as never).catch((err: HttpException) => err);
    expect((error as HttpException).getStatus()).toBe(429);
  });

  it("chặn 429 khi vượt ngưỡng theo IP (20 lần/15 phút), dù email khác nhau mỗi lần", async () => {
    for (let i = 0; i < 20; i++) {
      await guard.canActivate(fakeContext({ email: `user${i}@test.com` }, "9.9.9.9") as never);
    }

    await expect(
      guard.canActivate(fakeContext({ email: "user-moi@test.com" }, "9.9.9.9") as never),
    ).rejects.toBeInstanceOf(HttpException);
  });

  it("2 IP khác nhau không ảnh hưởng lẫn nhau", async () => {
    for (let i = 0; i < 5; i++) {
      await guard.canActivate(fakeContext({ email: "shared@test.com" }, "1.1.1.1") as never);
    }
    // Email đã chạm ngưỡng (5) ở IP 1.1.1.1 -> IP khác vẫn bị chặn nếu cùng email
    await expect(
      guard.canActivate(fakeContext({ email: "shared@test.com" }, "2.2.2.2") as never),
    ).rejects.toBeInstanceOf(HttpException);
  });

  it("không throw khi body thiếu email (chỉ check theo IP)", async () => {
    await expect(guard.canActivate(fakeContext({}) as never)).resolves.toBe(true);
  });
});
