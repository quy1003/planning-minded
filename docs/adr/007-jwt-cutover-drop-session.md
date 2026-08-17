# 007. Cắt hẳn sang JWT — bỏ session cookie, refresh token qua httpOnly cookie

## Context

Task #1–#5 (Phase 2) xây xong từng mảnh JWT (ký/verify, JWKS, refresh
rotation, revoke) chạy **song song** với session cookie Phase 1 — không đổi
`/auth/login` hay bất kỳ route CRUD nào. Task #6 (`docs/learning/42-auth-endpoints-migration.md`)
là bước "cắt" thật: `/auth/login`, `/auth/register` đổi sang trả JWT, mọi
route cần đăng nhập đổi từ `SessionAuthGuard` sang `JwtAuthGuard`.

2 câu hỏi mở khi bắt đầu code, đã hỏi và chốt cùng chủ repo:

1. **Hạ tầng session cũ** (`express-session`, `connect-redis`,
   `SessionAuthGuard`, `SessionSerializer`, `passport.session()`) sau khi
   `/auth/login` không còn tạo session — giữ lại phòng rollback, hay xóa
   hẳn?
2. **Refresh token trong `/auth/refresh` và `/auth/logout`** — đọc từ
   body (như task #4/#5 đã build) hay chỉ từ httpOnly cookie (đúng đề xuất
   gốc của task #6, chống XSS đọc trộm)?

## Decision

**Xóa hẳn session ngay** (không giữ lại song song):
- Xóa `SessionAuthGuard`, `SessionSerializer`.
- Bỏ `express-session`, `connect-redis`, `@types/express-session` khỏi
  `package.json`.
- `LocalAuthGuard` không còn gọi `logIn()` — chỉ verify password, gán
  `request.user` (Passport vẫn cần cho `AuthGuard("local")` chạy, nhưng
  không còn ghi session).
- `PassportModule.register({ session: false })`.
- `SESSION_SECRET` bỏ khỏi `env.schema.ts`/`.env`/`.env.example` — không
  còn ai đọc.
- **Giữ lại** `RedisService`/`RedisModule`/`REDIS_URL` — không phải
  session-specific, và ADR 006 để ngỏ khả năng Redis quay lại làm
  revocation list cho access token còn hạn (chưa quyết định chi tiết).
  Hiện tại Redis **không còn consumer nào** trong app — biết trước, chấp
  nhận được vì hạ tầng docker-compose vẫn cần cho tương lai gần.

**Refresh token chỉ qua httpOnly cookie** (`tripmind.rt`), không nhận qua
body nữa:
- `/auth/login`, `/auth/register` — set cookie qua `Set-Cookie`, trả
  `{ accessToken, user }` trong body (không có refresh token).
- `/auth/refresh` — đọc `req.cookies["tripmind.rt"]`, set cookie mới, trả
  **chỉ** `{ accessToken }` (raw refresh token không bao giờ lộ ra JSON).
- `/auth/logout` (đổi tên từ `/auth/revoke` — route session-based cũ đã bị
  xóa nên hết xung đột tên), `/auth/logout-all` (đổi tên từ
  `/auth/revoke-all`) — cùng đọc cookie, `logout` xóa cookie qua
  `res.clearCookie()`.
- Phải thêm `cookie-parser` (chưa có sẵn) — `express-session` trước đó tự
  parse cookie của nó, gỡ đi thì mất luôn khả năng đọc cookie thường.

**`@CurrentUserId()`** (decorator mới, đọc `req.jwtUser.id` do
`JwtAuthGuard` gán) thay `@CurrentUser()` (đọc `req.user`, gắn bởi
Passport) ở mọi route JWT-protected — vì JWT payload chỉ có `sub` (user
id), không đủ field `email`/`name` như `AuthUser` cũ đòi hỏi.
`@CurrentUser()` vẫn giữ, chỉ dùng ở `/auth/login` (đọc `request.user` do
`LocalStrategy.validate()` gán qua Passport).

## Consequences

- (+) Code sạch, không còn 2 cơ chế auth song song gây rối lúc đọc lại.
- (+) Model bảo mật httpOnly triệt để — JS không bao giờ chạm vào raw
  refresh token, dù qua kênh nào.
- (-) **Không có rollback nhanh** nếu JWT phát sinh vấn đề — phải revert
  code, không chỉ đổi cấu hình.
- (-) Toàn bộ integration test viết ở task #4/#5 (test qua body) phải
  viết lại để set/đọc cookie tay.
- (-) Logout chỉ thu hồi **refresh token** — access token đã phát hành
  (chưa hết 15 phút) vẫn verify offline được bình thường (test riêng xác
  nhận hành vi này là chủ đích, không phải bug). Muốn "kill ngay lập tức"
  cần thêm revocation list mà `JwtAuthGuard` tự tra — chưa xây, xem ADR
  006.
- `RedisService` hiện không consumer nào — theo dõi, cân nhắc gỡ hẳn nếu
  không dùng lại trong task #7 (tách `auth-service`) hoặc tính năng
  revocation-list tương lai.

## Bắt buộc theo CLAUDE.md

Thay đổi auth lớn nhất Phase 2 — chạy `/security-review` trước khi merge.
