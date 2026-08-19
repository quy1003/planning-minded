# 010. Tách `trip-service` thành app NestJS riêng (Phase 3 task #2)

## Context

`docs/03-roadmap.md` Phase 3 yêu cầu tách `trip-service`, `catalog-service` khỏi `apps/api`.
`trip/` là module CRUD hoàn chỉnh nhất trong `apps/api` (đã chạy đúng, có test — Phase 1),
`catalog/` chỉ là placeholder rỗng. Theo đúng tinh thần "logic đúng trong monolith trước, tách
boundary sau" đã áp dụng ở Phase 2 task #7 (`auth-service`), tách `trip` trước vì rủi ro thấp
nhất — không cần vừa viết logic mới vừa tách network boundary cùng lúc.

Kế hoạch đầy đủ: `docs/learning/48-trip-service-extraction.md`.

## Decision

Scaffold `apps/trip-service` bằng cách copy nguyên cấu trúc hạ tầng (`bootstrap/`, `common/`,
`config/`, `health/`, `prisma/` module wrapper) từ `apps/api` — 2 app này giống hệt nhau về
shape (không cookie/passport/Redis, chỉ verify JWT qua `JwtAuthGuard`), khác `auth-service`
(có cookie/passport/Redis) nên không dùng `auth-service` làm template. Toàn bộ `trip/` (9 file)
di chuyển nguyên trạng, không tổ chức lại.

**Database**: vẫn CHUNG 1 Postgres (`tripmind` DB) — đúng quyết định đã chốt ở
`docs/learning/46-phase3-index.md` mục "2 quyết định đã chốt": không tách DB vật lý ngay, chỉ
đảm bảo boundary trong code (schema.prisma riêng chỉ chứa `Trip`/`Place`/`ItineraryItem`,
`DATABASE_URL` đọc từ env riêng — dù giá trị hiện tại trùng với `apps/api`/`auth-service`).
Migration đầu tiên của `trip-service` **baseline** bằng `prisma migrate diff --from-empty` (sinh
SQL từ schema, không chạy) rồi `prisma migrate resolve --applied` — không dùng `migrate dev`
bình thường vì bảng đã tồn tại sẵn trong DB (tạo bởi `apps/api` trước khi tách). Giống hệt cách
`auth-service` đã baseline ở Phase 2 task #7, nhưng lần này qua `migrate diff --from-empty` thay
vì `migrate dev --create-only` — `migrate dev` từ chối chạy vì phát hiện "drift" giữa migration
history rỗng và DB thật có sẵn bảng của các service khác (`users`, `refresh_tokens`) trong cùng
Postgres, đòi reset cả database (sẽ mất dữ liệu). `migrate diff --from-empty` không kiểm tra state
thật của DB đích — chỉ diff schema.prisma so với "rỗng" — nên tránh được vấn đề này.

**Port**: `trip-service` dev = `3004`, test riêng = `3005` (không dùng `3001` — phát hiện lúc
tách rằng `apps/api/test/db-test-helper.ts` hardcode `PORT=3001`, trùng đúng port `apps/web` dev
server, gây `EADDRINUSE` bất cứ khi nào chạy integration test song song với `pnpm dev`; sửa luôn
khi di chuyển file này sang `trip-service`).

**`apps/web/next.config.ts`**: thêm rule `/api/v1/trips/:path*` → `trip-service`, đặt **trước**
rule chung `/api/v1/:path*` (rule cụ thể hơn phải đứng trước).

## Consequences

- (+) `trip-service` verify được qua integration test thật (gọi thẳng qua network, JWKS thật từ
  fake auth-service) — không mock DB, không mock JWT verify.
- (+) `apps/api` giờ chỉ còn `catalog/` (rỗng) + `JwtAuthGuard` — không còn lý do tồn tại riêng
  sau khi task #3 (Phase 3, xây `catalog-service` mới) xong; dự kiến xoá hẳn lúc đó.
- (+) Bug port test `3001` (đụng `apps/web` dev) được sửa nhân tiện lúc di chuyển file, không
  còn lặp lại ở `trip-service`.
- (-) `apps/api` tạm thời "rỗng" (chỉ còn 1 module placeholder) trong lúc chờ task #3 — đã thêm
  `--passWithNoTests` vào script `test:integration` để không fail CI/lệnh thủ công vì "no tests
  found".
- Vẫn còn nợ kỹ thuật đã biết trước: `trip-service` và `apps/api`/`auth-service` share 1 Postgres
  — chấp nhận đến khi có nhu cầu thật tách DB vật lý (không phải mục tiêu Phase 3 theo quyết định
  đã chốt).
