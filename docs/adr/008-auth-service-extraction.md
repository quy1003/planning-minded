# 008. Tách `auth-service` thành app NestJS riêng (Phase 2 task #7)

## Context

`docs/03-roadmap.md` Phase 2 ghi rõ: `auth-service` là service **đầu tiên**
tách khỏi monolith (ngoại lệ trước Phase 3), vì auth ổn định hơn business
logic và giúp luyện kỹ năng tách service quy mô nhỏ trước khi tách nhiều
service cùng lúc ở Phase 3.

Tách sau khi task #1-#6 (JWT, JWKS, refresh rotation, revocation, rate
limit) đã chạy ổn trong modular monolith — đúng tinh thần "chạy đúng trong
monolith trước, tách boundary sau" đã ghi trong `36-phase2-index.md`.

## Decision

Tạo `apps/auth-service` (NestJS app độc lập, port 3002 local) chứa toàn bộ
`AuthController`/`AuthService`/`JwtService`/`RefreshTokenService`/
`JwksController`/`LoginRateLimitGuard`/`LocalStrategy` — di chuyển nguyên
vẹn từ `apps/api`. `apps/api` chỉ giữ lại `JwtAuthGuard` (verify-only, fetch
JWKS qua HTTP thật tới `auth-service` thay vì loopback nội bộ).

**3 quyết định kỹ thuật đáng nhớ khi thực hiện:**

1. **Prisma Client output riêng mỗi app** (`src/generated/prisma-client`,
   không dùng vị trí mặc định `node_modules/@prisma/client`) — pnpm dedupe
   2 app cùng version `@prisma/client` vào chung 1 vị trí trong store,
   `prisma generate` của app này sẽ ghi đè client app kia nếu dùng mặc
   định. Phải khai `assets`/`watchAssets` trong `nest-cli.json` để
   `nest build`/`nest start --watch` copy thư mục này vào `dist/` (mặc
   định NestJS CLI chỉ compile `.ts`, không tự copy asset ngoài).

2. **Baseline Prisma migration cho DB đã tồn tại data** — `auth-service` và
   `apps/api` dùng CHUNG 1 Postgres (database-per-service là việc Phase 3).
   `_prisma_migrations` là bảng CHUNG trong DB thật — `auth-service` (dự
   án Prisma mới, thư mục `migrations/` rỗng) thấy DB đã có 3 migration
   ghi nhận từ `apps/api` → nếu chạy `migrate dev` bình thường sẽ đòi
   **reset toàn bộ DB** (mất data thật). Cách xử lý: copy 2 migration liên
   quan `User`/`RefreshToken` (giữ nguyên tên + nội dung, checksum khớp)
   từ `apps/api/prisma/migrations/` sang `auth-service` — Prisma nhận ra
   khớp với bản ghi đã áp dụng, không cần chạy lại SQL. `apps/api` xóa
   model khỏi schema nhưng **giữ nguyên** migration lịch sử, chỉ chạy
   `prisma generate` (không `migrate dev`) khi đổi schema — tránh Prisma
   tạo migration DROP TABLE cho bảng mà service khác vẫn cần.

3. **Test integration của `apps/api` cần "auth-service giả"** —
   `TripController` dùng `JwtAuthGuard`, giờ fetch JWKS qua HTTP thật (không
   mock `jwtVerify`) tới domain auth-service — nhưng test riêng của
   `apps/api` không boot `auth-service` thật. Giải pháp:
   `test/fake-auth-service.ts` — 1 HTTP server tối giản tự sinh keypair
   test, serve đúng JWKS thật, ký token test — không mock cơ chế verify,
   chỉ thay THỰC THỂ auth-service bằng bản tối giản cho mục đích test.

## Consequences

- (+) `apps/api` không còn cookie/password/Redis gì cả — chỉ verify JWT
  (Bearer header), code gọn hẳn (bỏ `argon2`, `passport*`, `cookie-parser`,
  `redis` khỏi dependencies).
- (+) Luyện được đúng kỹ năng roadmap đề ra: tách 1 service nhỏ, hiểu rõ
  trade-off boundary qua HTTP thay vì import trực tiếp.
- (-) Deploy giờ cần 3 service riêng (api, web, auth-service) thay vì 2 —
  việc deploy `auth-service` lên Render (Render service thứ 3) chưa làm,
  để bạn tự làm theo đúng quy trình đã làm với `apps/api`
  (`docs/learning/35-deploy-plan.md`).
- (-) 2 app seed riêng, có thứ tự phụ thuộc: `auth-service` phải seed demo
  user TRƯỚC, `apps/api` mới seed được trip cho user đó (tự tra qua raw SQL,
  không còn model `User` trong schema).
- Database-per-service thật (Postgres riêng cho từng service) vẫn để dành
  Phase 3, đúng roadmap — hiện `auth-service` và `apps/api` vẫn chung 1
  connection string.
