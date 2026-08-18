import { randomUUID } from "node:crypto";
import { HttpException, HttpStatus, Injectable, type CanActivate, type ExecutionContext } from "@nestjs/common";
import type { Request } from "express";
import { RedisService } from "../../redis/redis.service";

const EMAIL_LIMIT = 5;
const EMAIL_WINDOW_MS = 15 * 60 * 1000; // 15 phút

const IP_LIMIT = 20; // nới hơn email — nhiều user thật có thể chung 1 IP (NAT, mạng công ty)
const IP_WINDOW_MS = 15 * 60 * 1000;

/**
 * Chặn brute-force password ở /auth/login — đếm MỌI lần thử (không phân biệt
 * đúng/sai, xem trade-off trong docs/learning/44-auth-rate-limiting.md), theo
 * cả email lẫn IP. Vượt 1 trong 2 ngưỡng → 429.
 */
@Injectable()
export class LoginRateLimitGuard implements CanActivate {
  constructor(private readonly redisService: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const email = typeof request.body?.email === "string" ? request.body.email.toLowerCase() : undefined;

    const checks: Promise<void>[] = [
      this.checkAndRecord(`ratelimit:login:ip:${request.ip}`, IP_LIMIT, IP_WINDOW_MS),
    ];
    if (email) {
      checks.push(this.checkAndRecord(`ratelimit:login:email:${email}`, EMAIL_LIMIT, EMAIL_WINDOW_MS));
    }
    await Promise.all(checks);

    return true;
  }

  /**
   * Sliding window log: xóa timestamp cũ hơn window, đếm còn lại, vượt ngưỡng
   * thì throw 429 (KHÔNG ghi thêm lần này); chưa vượt thì ghi nhận lần thử.
   */
  private async checkAndRecord(key: string, limit: number, windowMs: number): Promise<void> {
    const client = this.redisService.client;
    const now = Date.now();
    const windowStart = now - windowMs;

    await client.zRemRangeByScore(key, 0, windowStart);
    const attemptCount = await client.zCard(key);

    if (attemptCount >= limit) {
      throw new HttpException(
        { detail: "Too many login attempts, please try again later", category: "business" },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // member phải unique dù trùng timestamp (2 request tới cùng 1ms) — không thì
    // ZADD lần sau chỉ ghi đè score của member cũ thay vì thêm phần tử mới,
    // khiến zCard đếm thiếu.
    await client.zAdd(key, { score: now, value: `${now}-${randomUUID()}` });
    await client.expire(key, Math.ceil(windowMs / 1000));
  }
}
