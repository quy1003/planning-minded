# Task nhỏ #3 — Kết nối Redis

## Task này làm gì?

Tương tự Task #2 (Prisma/Postgres) nhưng cho Redis: tạo 1 `RedisService` kết nối tới Redis lúc app khởi động, ngắt kết nối lúc app tắt.

## Vì sao cần Redis ở đây?

Phase 1 dùng **session-based auth** (xem `docs/03-roadmap.md`): sau khi user đăng nhập, server tạo ra 1 "session" (gói dữ liệu nhỏ, ví dụ `{ userId: "..." }`) và phải **lưu nó ở đâu đó** giữa các lần request (vì HTTP không tự nhớ gì giữa 2 request). Redis là nơi lưu — 1 database key-value, cực nhanh, sống trong RAM, phù hợp cho dữ liệu "sống ngắn hạn" như session (khác Postgres — nơi lưu dữ liệu "sống lâu dài" như user, trip).

Nếu không dùng Redis mà lưu session ngay trong RAM của process Node (`MemoryStore` mặc định của `express-session`) thì: mỗi lần restart server, **mọi người bị đăng xuất** (session mất sạch); và nếu sau này chạy nhiều instance API cùng lúc (scale ngang) thì mỗi instance có bộ nhớ riêng, user login ở instance A nhưng request sau bị route sang instance B sẽ thấy "chưa đăng nhập". Redis giải quyết cả 2 vấn đề vì nó là 1 nơi lưu trữ dùng chung, độc lập với process Node.

## Các bước nhỏ

1. Cài package `redis` (client kết nối Redis từ Node.js).
2. **`apps/api/src/redis/redis.service.ts`** — giống hệt cấu trúc `PrismaService`: `@Injectable()`, tạo client trong constructor, `onModuleInit()` gọi `client.connect()`, `onModuleDestroy()` gọi `client.quit()`.
3. **`apps/api/src/redis/redis.module.ts`** — `@Global()`, export `RedisService`.
4. Wire vào `app.module.ts`.

## Cách bạn tự test

```bash
docker compose -f infra/docker-compose.yml up -d
docker ps   # phải thấy tripmind-redis-1 "healthy"

pnpm --filter @tripmind/api dev
# kỳ vọng: app lên bình thường, không lỗi kết nối Redis
```

Muốn chắc chắn Redis đang sống độc lập với app:
```bash
docker exec -it tripmind-redis-1 redis-cli ping
# kỳ vọng: PONG
```

## Phạm vi KHÔNG làm ở task này
Chưa dùng `RedisService` để lưu session thật — đó là Task #4 (session bootstrap).
