# Task nhỏ #6 — Viết test cho Auth (unit + integration)

> Trạng thái: **✅ xong** (2026-07-15).
> Nhật ký tổng: `docs/nhat-ky.md`.

## Task này làm gì?

Viết 2 loại test khác nhau cho toàn bộ Auth module vừa xong ở Task #5:
- **Unit test** — test 1 hàm/1 class riêng lẻ, không đụng database thật, chạy cực nhanh.
- **Integration test** — test cả luồng thật (HTTP request → controller → service → database thật), chậm hơn nhưng đáng tin hơn.

## Vì sao cần cả 2, không chỉ 1 loại?

`CLAUDE.md` (quy tắc dự án) ghi: *"integration dùng Testcontainers, không mock DB"* — nghĩa là **không được giả lập (mock)** database trong integration test. Lý do: nếu mock Prisma giả (tự viết `{ user: { create: () => ({...}) } }`), test có thể pass dù code thật sai (vd quên ràng buộc unique email) — vì bạn đang test cái giả do chính mình viết ra, không test được hành vi thật của Postgres. Nhưng chạy **toàn bộ** test bằng database thật cũng chậm và cần Docker luôn bật — nên unit test (không đụng DB, cho phần logic thuần như hash password) vẫn cần, chạy nhanh, chạy thường xuyên.

## Khái niệm mới

- **Testcontainers** — thư viện tự động **bật container Docker mới** lúc test chạy, rồi **tự tắt** khi xong. Mỗi lần `pnpm test:integration` là môi trường sạch.
- **Postgres + Redis containers** — `AppModule` cần cả Prisma và Redis (session). Integration bật **cả hai** container (doc cũ chỉ nói Postgres — thiếu Redis sẽ fail lúc boot).
- **`prisma db push`** — đẩy schema lên DB test **không** tạo file migration (container bỏ sau test). Dev thật vẫn dùng `migrate dev`.
- **`supertest` / `supertest.agent`** — gọi HTTP trong process Nest; `agent` nhớ cookie giữa các request (giống browser).

## Các bước nhỏ

1. Unit: `utils/password.util.spec.ts`, `common/pipes/zod-validation.pipe.spec.ts`, `strategies/local.strategy.spec.ts`
2. `test/db-test-helper.ts` — Postgres + Redis Testcontainers, set env, `prisma db push`
3. `test/auth.integration-spec.ts` — register / login / me / logout
4. `jest.integration.config.js` + script `test:integration`; unit jest **ignore** `*.integration-spec.ts`

## Cách bạn tự chạy

```bash
# Unit — không cần Docker
pnpm --filter @tripmind/api test

# Integration — cần Docker daemon (Testcontainers tự kéo image)
pnpm --filter @tripmind/api test:integration
```

## Sau task này

Auth module (Task #1 → #6) xong → **Trip CRUD** (file học riêng khi tới lúc đó).
