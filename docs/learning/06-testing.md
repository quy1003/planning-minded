# Task nhỏ #6 — Viết test cho Auth (unit + integration)

## Task này làm gì?

Viết 2 loại test khác nhau cho toàn bộ Auth module vừa xong ở Task #5:
- **Unit test** — test 1 hàm/1 class riêng lẻ, không đụng database thật, chạy cực nhanh.
- **Integration test** — test cả luồng thật (HTTP request → controller → service → database thật), chậm hơn nhưng đáng tin hơn.

## Vì sao cần cả 2, không chỉ 1 loại?

`CLAUDE.md` (quy tắc dự án) ghi: *"integration dùng Testcontainers, không mock DB"* — nghĩa là **không được giả lập (mock)** database trong integration test. Lý do: nếu mock Prisma giả (tự viết `{ user: { create: () => ({...}) } }`), test có thể pass dù code thật sai (vd quên ràng buộc unique email) — vì bạn đang test cái giả do chính mình viết ra, không test được hành vi thật của Postgres. Nhưng chạy **toàn bộ** test bằng database thật cũng chậm và cần Docker luôn bật — nên unit test (không đụng DB, cho phần logic thuần như hash password) vẫn cần, chạy nhanh, chạy thường xuyên.

## Khái niệm mới

- **Testcontainers** — thư viện tự động **bật 1 container Docker Postgres mới tinh, trống trơn** ngay lúc test bắt đầu chạy, rồi **tự tắt** khi test xong. Mỗi lần chạy `pnpm test:integration` là 1 database hoàn toàn sạch, không lo test trước để lại rác ảnh hưởng test sau.
- **`prisma db push`** (khác `migrate dev` ở Task #2) — đẩy thẳng `schema.prisma` lên database mà **không tạo file migration** (không cần lịch sử, vì container này bị xóa ngay sau khi test xong, không cần nhớ lại lịch sử làm gì). Dùng `db push` cho test cho nhanh; dùng `migrate dev` cho môi trường dev thật (cần lưu lịch sử để deploy sau này).
- **`supertest`** — thư viện gọi HTTP request giả lập tới app Nest ngay trong Node (không cần app đang chạy ở port thật), dùng để viết `request(app.getHttpServer()).post("/auth/login").send({...})` giống hệt `curl` nhưng viết bằng code, tự động assert (`expect(...)`).
- **`supertest.agent(...)`** — bản đặc biệt của supertest, **tự nhớ cookie** giữa các lần gọi (giống trình duyệt thật) — cần thiết để test luồng "login xong gọi `/me` bằng cookie vừa nhận".

## Các bước nhỏ

1. **Unit test** (đặt cạnh file nguồn, đuôi `.spec.ts`):
   - `password.util.spec.ts` — hash rồi verify đúng/sai, 2 lần hash cùng password ra 2 chuỗi khác nhau (do salt ngẫu nhiên).
   - `zod-validation.pipe.spec.ts` — input đúng thì pass qua, input sai thì throw.
   - `local.strategy.spec.ts` — giả lập (stub) `AuthService` bằng object đơn giản, test riêng logic của `LocalStrategy` (không cần DB thật vì AuthService ở đây chỉ là giả).
2. **Integration test** (đuôi `.integration-spec.ts`, tách riêng để không lẫn với unit test khi chạy `pnpm test`):
   - `test/db-test-helper.ts` — hàm `startTestDatabase()`: bật container Postgres, set `process.env.DATABASE_URL` trỏ vào container đó, chạy `prisma db push`.
   - `auth.integration-spec.ts` — dùng `startTestDatabase()` + `Test.createTestingModule({ imports: [AppModule] })` + `configureApp()` (dùng lại y hệt hàm ở Task #4 — đây chính là lý do task #4 tách hàm riêng), rồi test toàn bộ luồng register/login/me/logout bằng supertest.
3. Thêm file cấu hình jest riêng cho integration test (`jest.integration.config.js`) + script `test:integration` trong `package.json`.

## Cách bạn tự chạy

```bash
# Unit test — nhanh, không cần Docker
pnpm --filter @tripmind/api test

# Integration test — cần Docker đang chạy (Testcontainers tự bật thêm 1 Postgres riêng)
docker compose -f infra/docker-compose.yml up -d
pnpm --filter @tripmind/api test:integration
```

Kỳ vọng: cả 2 lệnh đều pass hết (xanh), không skip test nào.

## Sau task này

Auth module (Task #1 → #6) coi như xong — bước tiếp theo theo `docs/03-roadmap.md` Phase 1 là **Trip CRUD** (sẽ viết file học riêng khi tới lúc đó).
