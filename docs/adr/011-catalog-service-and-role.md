# 011. Xây `catalog-service` mới + thêm `role` vào JWT claims (Phase 3 task #3)

## Context

`docs/03-roadmap.md` Phase 3 yêu cầu tách `catalog-service`. Khác `trip-service` (task #2 —
tách code có sẵn), `catalog/` trong `apps/api` trước đó chỉ là module rỗng — không có gì để
tách, phải viết mới hoàn toàn. Yêu cầu D1-D3 (`docs/01-requirements.md`) cần 2 mức quyền trên
cùng resource: admin CRUD `Destination`/`Poi`, user thường chỉ đọc công khai. Kế hoạch đầy đủ:
`docs/learning/49-catalog-service.md`.

## Decision

### 1. Scaffold từ `trip-service`, không phải `auth-service`

`trip-service` gần với shape catalog-service cần hơn (không cookie/passport/Redis, chỉ
`JwtAuthGuard`) — copy nguyên hạ tầng (`bootstrap/`, `common/`, `config/`, `health/`,
`prisma/` wrapper), viết mới hoàn toàn phần domain (`catalog/`).

### 2. Thêm `role` vào `User` (auth-service) + JWT claims

`enum UserRole { USER ADMIN }` trên model `User`, mint vào JWT payload lúc ký access token
(`JwtService.signAccessToken(userId, role)`). `JwtAuthGuard` (duplicate ở 4 service: auth-service,
apps/api, trip-service, catalog-service) đọc claim này, gán `request.jwtUser = { id, role }`.
`UserRole` type/schema khai báo ở `packages/shared` (contract dùng chung, không duplicate literal
ở từng service — đúng convention `CLAUDE.md`).

Refresh endpoint (`POST /auth/refresh`) tra lại `role` hiện tại từ DB (không lấy từ claim cũ) khi
ký access token mới — nếu role đổi sau khi login, access token mới phải phản ánh đúng quyền hiện
tại.

### 3. `AdminGuard` — guard mới, chỉ ở `catalog-service`

Check `request.jwtUser.role === "ADMIN"`, đứng **sau** `JwtAuthGuard` trong
`@UseGuards(JwtAuthGuard, AdminGuard)` (guard chạy theo thứ tự khai báo — AdminGuard không tự
verify token, chỉ đọc `request.jwtUser` đã có sẵn). Route `GET` (public read, D3) không gắn guard
nào; route `POST`/`PATCH`/`DELETE` (D2) gắn cả 2. Không đặt `AdminGuard` ở `packages/shared` —
theo đúng pattern hiện có, guard NestJS không dùng chung qua import (duplicate code khi cần, xem
`JwtAuthGuard`), chỉ *type* (`UserRole`) mới dùng chung.

### 4. Migration cho bảng MỚI trong DB share — vẫn cần né "drift" như task #2

`destinations`/`pois` là bảng hoàn toàn mới (không tồn tại sẵn, khác `trip-service`/`auth-service`
lúc baseline) — nhưng `prisma migrate dev` **vẫn bị chặn** vì DB share với các service khác (drift
so với migration history rỗng của chính service này, đòi reset cả DB). Giải pháp giống hệt task
#2: `prisma migrate diff --from-empty --to-schema-datamodel` (chỉ diff riêng schema, không đụng
DB thật) → ghi SQL vào migration file thủ công → `prisma db execute` chạy SQL đó lên DB thật →
`prisma migrate resolve --applied` ghi nhận vào lịch sử.

Việc thêm cột `role` vào `users` (auth-service) cũng gặp y hệt vấn đề này dù chỉ là 1
`ALTER TABLE` nhỏ — dùng `migrate diff --from-url <DATABASE_URL thật> --to-schema-datamodel`
(so schema với DB thật, không qua migration history) rồi **tự tay lọc bỏ** các dòng `DROP
TABLE`/`DROP CONSTRAINT` mà lệnh này sinh ra cho bảng của service khác (nó coi mọi bảng không
thuộc schema của mình là "thừa cần xóa") — chỉ giữ lại `CREATE TYPE`/`ALTER TABLE ADD COLUMN` an
toàn, rồi áp dụng + resolve như trên.

→ Kết luận chung (ghi lại để không phải suy nghĩ lại lần sau): **mọi migration mới trên DB dùng
chung nhiều service đều không được chạy `prisma migrate dev` trực tiếp** — luôn generate SQL qua
`migrate diff` (`--from-empty` cho bảng mới, `--from-url` cho sửa bảng có sẵn + tự lọc bỏ phần
DROP của service khác), soát lại nội dung, `db execute` thủ công, rồi `migrate resolve --applied`.

## Consequences

- (+) `catalog-service` CRUD đầy đủ, test qua network thật (6/6 integration test) — public read
  không cần token, admin route 403 đúng khi thiếu quyền, 401 khi thiếu token, 409 khi trùng tên.
- (+) `role` là contract dùng chung sạch (`packages/shared`), không lặp lại "USER"/"ADMIN" ở
  nhiều nơi.
- (-) Route quản trị role hiện **không có UI/API** để đổi role user thường → admin — chỉ set qua
  seed hoặc `UPDATE` tay trong DB. Chấp nhận được ở quy mô học tập hiện tại (task doc đã ghi rõ
  "phạm vi không làm").
- `apps/api` sau task này **thật sự rỗng** (chỉ còn `JwtAuthGuard` không route nào dùng tới) —
  cân nhắc xóa hẳn, cần xác nhận riêng trước khi làm (không tự xóa trong task này).
