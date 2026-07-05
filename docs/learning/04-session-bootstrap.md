# Task nhỏ #4 — Session Bootstrap (cookie đăng nhập)

## Task này làm gì?

Gắn 2 middleware vào app: `express-session` (quản lý session, lưu vào Redis) và `passport` (framework xử lý "ai đang đăng nhập", sẽ dùng ở Task #5). Task này **chưa có logic đăng nhập thật** — chỉ là lắp đường ống, giống như lắp đường nước trước khi có vòi.

## Khái niệm mới

- **Session là gì?** Sau khi đăng nhập thành công, server tạo 1 "session" — 1 gói dữ liệu nhỏ (`{ userId: "abc123" }`) — lưu vào Redis (Task #3) kèm 1 `sessionId` ngẫu nhiên. Server gửi `sessionId` đó về trình duyệt qua **cookie**. Từ request sau, trình duyệt tự động đính kèm cookie đó, server tra `sessionId` trong Redis ra lại `userId` → biết "à, đây là user này đang gọi request".
- **`express-session`** — thư viện tạo/đọc/xóa cookie session tự động, bạn không phải tự viết logic đó.
- **`connect-redis`** — "cầu nối" giữa `express-session` và Redis: bảo `express-session` "lưu session vào Redis (Task #3), đừng lưu trong RAM".
- **`passport`** — thư viện chuẩn hóa việc xác thực (đăng nhập bằng email/password, hoặc sau này Google OAuth...). Task #5 mới thật sự cấu hình "cách xác thực bằng email/password"; task này chỉ bật `passport.initialize()`/`passport.session()` (yêu cầu bắt buộc của passport để nó biết đọc `req.session`).
- **Cookie `httpOnly`** — JavaScript ở trình duyệt **không đọc được** cookie này (chỉ trình duyệt tự gửi kèm request) — chống 1 dạng tấn công phổ biến (XSS đánh cắp cookie).

## Vì sao tách riêng hàm `configureApp()` thay vì viết thẳng trong `main.ts`?

Vì lúc viết test (Task #6), NestJS's `Test.createTestingModule(...)` **không tự chạy lại** đoạn code trong `main.ts` — nó chỉ dựng lại các Module/Provider, không dựng lại middleware bạn gắn thủ công bằng `app.use(...)`. Nếu để hết logic session trong `main.ts`, lúc test sẽ thiếu session middleware, test login sẽ luôn fail dù code đúng. Tách thành 1 hàm `configureApp(app, ...)` dùng chung được ở cả `main.ts` (chạy thật) và file test (Task #6) — gọi cùng 1 hàm nên đảm bảo môi trường giống nhau.

## Các bước nhỏ

1. Cài `express-session`, `connect-redis`, `passport`, `@nestjs/passport` + các gói `@types/...` tương ứng.
2. **`apps/api/src/bootstrap/configure-app.ts`** — hàm `configureApp(app, configService, sessionStore?)`:
   - `app.use(session({ store, secret, cookie: { httpOnly: true, ... } }))`
   - `app.use(passport.initialize())`
   - `app.use(passport.session())`
   - (Tham số `sessionStore` để trống — sẽ dùng ở Task #6: test không cần Redis thật, để trống thì `express-session` tự dùng bộ nhớ tạm, đủ cho vòng đời ngắn của 1 lần chạy test.)
3. Sửa `main.ts`: sau khi có `app` và `configService`, tạo `RedisStore` thật (dùng `RedisService` của Task #3) rồi gọi `configureApp(app, configService, store)`.

## Cách bạn tự test

```bash
docker compose -f infra/docker-compose.yml up -d
pnpm --filter @tripmind/api dev
```
Task này chưa có endpoint đăng nhập thật, nên cách test là: app vẫn chạy bình thường, không lỗi. Test session thật sự (đăng nhập, giữ cookie, đăng xuất) sẽ làm ở Task #5.

## Phạm vi KHÔNG làm ở task này
Chưa có `/auth/login`, `/auth/register` — logic xác thực thật là Task #5.
