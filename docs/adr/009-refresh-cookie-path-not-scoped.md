# 009. Không thu hẹp `path` cookie refresh token — giữ mặc định `"/"`

## Context

`/security-review` chạy sau task #7 (tách `auth-service`) flag: cookie
`tripmind.rt` (refresh token, httpOnly) không set `path` → Express mặc định
`Path=/` → cookie bị gửi kèm **mọi** request tới `auth-service`, kể cả
`/health`, `/.well-known/jwks.json` — không đúng nguyên tắc least privilege.

Thử 2 hướng thu hẹp, cả 2 đều vỡ:

1. **`path: "/auth"`** (khớp route nội bộ `@Controller("auth")` của chính
   `auth-service`) — nhưng browser thật không bao giờ gọi thẳng `/auth/*`.
   Nó gọi same-origin `/api/auth/*`; Next rewrite (`apps/web/next.config.ts`)
   mới chuyển sang `auth-service` ở `/auth/*`. Set-Cookie với `Path=/auth`
   không match request `/api/auth/refresh` từ góc nhìn browser → cookie
   không bao giờ được gửi lại → refresh vỡ ngay trên web thật.
2. **`path: "/api/auth"`** (khớp path browser thật thấy) — sửa lại thì vỡ
   theo hướng khác: `apps/auth-service/test/auth.integration-spec.ts` (test
   tích hợp có sẵn, gọi thẳng service ở path thật của nó `/auth/login`,
   `/auth/refresh`, dùng `supertest.agent` mô phỏng cookie-jar thật) fail —
   `Path=/api/auth` không match `/auth/refresh` → 401 "missing refresh
   token". Test này đại diện đúng cách mọi integration test trong repo gọi
   service (`docs/CLAUDE.md`: "integration dùng Testcontainers, không mock
   DB", tức gọi thẳng app instance, không qua proxy của `apps/web`).

## Vấn đề gốc: 2 tiền tố path không giao nhau

`auth-service` tự thấy mình ở `/auth/*` (route nội bộ, `@Controller("auth")`).
Browser thật chỉ thấy nó ở `/api/auth/*` (tiền tố `/api` do `apps/web` tự
quyết định khi rewrite, hoàn toàn là quyết định của consumer, không phải
của service). Đây là 2 chuỗi path **rời nhau hoàn toàn** — không có giá trị
`path` nào ngắn hơn `"/"` mà cả "gọi thẳng service" (test, curl thủ công) và
"qua proxy web" (browser thật) cùng khớp.

Muốn cookie `path` hẹp hơn `"/"` mà vẫn đúng cả 2 phía, cần 1 trong 2:

- `auth-service` tự biết prefix `/api/auth` mà `apps/web` dùng để proxy nó
  — sai layering: 1 service không nên phụ thuộc vào cách 1 consumer cụ thể
  route tới nó.
- Đổi rewrite của `apps/web` để không thêm tiền tố `/api` cho auth
  (`/auth/*` → `auth-service` 1:1 thay vì `/api/auth/*` → `/auth/*`) — khả
  thi nhưng động tới `apps/web/src/lib/api-client.ts` (hiện dùng chung 1
  tiền tố `/api` cho mọi request, cả `trip`/`catalog` lẫn `auth`) — phạm vi
  rộng hơn hẳn 1 finding cookie `path`, không làm ở đây.

## Decision

Giữ cookie `tripmind.rt` ở `path: "/"` (mặc định, không set). Chấp nhận nó
được gửi kèm cả tới `/health`, `/.well-known/jwks.json` và mọi trang trên
`apps/web` (`/vi/trips`...).

Lớp phòng thủ thật cho refresh token vẫn đứng vững, không phụ thuộc `path`:
- `httpOnly: true` — JS (kể cả bị XSS chèn) không đọc được giá trị token.
- `secure: true` (production) — không bao giờ gửi qua HTTP không mã hóa.
- `sameSite: "lax"` — chặn phần lớn kịch bản CSRF (request cross-site
  không tự động kèm cookie, trừ navigation top-level GET).
- Refresh token hash trước khi lưu DB (ADR 006) — lộ DB cũng không dùng
  được token.

`path` hẹp chỉ là 1 lớp *thêm* (giảm số nơi cookie "đi tới" nếu 1 endpoint
tương lai vô tình log cookie) — không phải lớp phòng thủ chính. Đánh đổi
không đáng: phải hoặc sai layering (service phụ thuộc consumer), hoặc mở 1
task tái cấu trúc routing prefix lớn hơn hẳn phạm vi finding này.

## Consequences

- (+) Không phải sửa gì — 0 rủi ro regression, giữ 22/22 integration test
  xanh nguyên trạng.
- (+) Không tạo phụ thuộc ngược (auth-service biết về prefix của web).
- (-) Finding `/security-review` về cookie `path` coi như **chấp nhận rủi
  ro đã biết** (accepted risk), không fix — nếu chạy `/security-review`
  lần sau, finding này có thể lặp lại; tham chiếu ADR này khi review lại.
- Nếu sau này tái cấu trúc routing giữa `apps/web` và các service (khả
  năng cao rơi vào Phase 3 — API gateway thật sự thay cho Next rewrite thủ
  công) và tiền tố path được thiết kế thống nhất, có thể mở lại việc thu
  hẹp `path` cookie lúc đó — không phải bây giờ.
