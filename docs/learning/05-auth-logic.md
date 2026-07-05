# Task nhỏ #5 — Auth thật: đăng ký / đăng nhập / đăng xuất

## Task này làm gì?

Đây là task "lắp vòi nước" — dùng tất cả những gì đã setup (Config #1, Prisma #2, Redis #3, Session #4) để làm ra 4 endpoint thật:
- `POST /auth/register` — tạo user mới
- `POST /auth/login` — đăng nhập, tạo session
- `POST /auth/logout` — xóa session
- `GET /auth/me` — trả về user đang đăng nhập (dùng để test session còn sống hay không)

## Khái niệm mới

- **Hash password bằng `argon2`** — **không bao giờ lưu password dạng chữ thường (plaintext)** vào database. Nếu database bị lộ, hacker thấy password thật ngay lập tức. `argon2.hash(password)` biến password thành 1 chuỗi không thể đảo ngược lại thành password gốc; lúc đăng nhập, dùng `argon2.verify(hash, password)` để kiểm tra password nhập vào có khớp hash đã lưu không — **không cần** và **không thể** giải mã hash để lấy lại password gốc.
- **Zod Validation Pipe** — `apps/api` cần 1 "chốt chặn" kiểm tra dữ liệu request gửi lên có đúng format không (email hợp lệ, password đủ dài...) **trước khi** chạm vào logic thật. Đã có sẵn `registerSchema`/`loginSchema` (zod) ở `packages/shared` — task này viết 1 "Pipe" (khái niệm NestJS: 1 bước xử lý dữ liệu trước khi vào hàm controller) dùng lại schema đó.
- **Passport `LocalStrategy`** — "cách xác thực" cụ thể bằng email+password. Bạn viết 1 hàm `validate(email, password)` trả về user nếu đúng, throw lỗi nếu sai — passport tự lo phần còn lại (đọc `req.body`, gọi hàm này, gắn kết quả vào `req.user`).
- **`Guard`** — 1 "người gác cổng" trước khi vào route handler, quyết định cho qua hay chặn. `LocalAuthGuard` chặn `/auth/login` nếu email/password sai. `SessionAuthGuard` (tự viết) chặn `/auth/me` nếu chưa đăng nhập (check `req.isAuthenticated()`).
- **`@CurrentUser()` decorator** — 1 helper tự viết, lấy `req.user` ra cho gọn, dùng trong controller như `me(@CurrentUser() user) {...}` thay vì phải viết `@Req() req` rồi tự gõ `req.user` mỗi lần.
- **RFC 9457 (`problem+json`)** — chuẩn định dạng lỗi HTTP (đã ghi trong `CLAUDE.md`). Thay vì mỗi lỗi trả về JSON tùy tiện, mọi lỗi đều có format thống nhất: `{ type, title, status, detail, instance }`. Viết 1 `ExceptionFilter` (bắt mọi lỗi, format lại theo chuẩn này) dùng chung cho toàn app.

## Các bước nhỏ (thứ tự làm)

1. `apps/api/src/auth/password.util.ts` — 2 hàm `hashPassword`/`verifyPassword` (bọc `argon2`), tách riêng để test không cần đụng database.
2. `apps/api/src/common/pipes/zod-validation.pipe.ts` — Pipe dùng chung, nhận vào 1 zod schema bất kỳ.
3. `apps/api/src/common/filters/http-exception.filter.ts` — format lỗi theo RFC 9457.
4. `apps/api/src/common/decorators/current-user.decorator.ts` — lấy `req.user`.
5. `apps/api/src/auth/auth.service.ts` — `register()` (hash password + lưu DB, bắt lỗi email trùng), `validateUser()` (dùng cho login), `findById()` (dùng để khôi phục session).
6. `apps/api/src/auth/local.strategy.ts` + `local-auth.guard.ts` — cấu hình passport-local.
7. `apps/api/src/auth/session.serializer.ts` — dạy passport cách lưu/khôi phục user vào session (chỉ lưu `userId`, không lưu cả object user vào session cho gọn).
8. `apps/api/src/auth/guards/session-auth.guard.ts` — check đã đăng nhập chưa.
9. `apps/api/src/auth/auth.controller.ts` — 4 endpoint.
10. Sửa `auth.module.ts` — đăng ký hết các thứ trên.

## Cách bạn tự test (dùng `curl`)

```bash
docker compose -f infra/docker-compose.yml up -d
pnpm --filter @tripmind/api dev
```

```bash
# 1. Đăng ký
curl -i -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"a@a.com","password":"password123"}'
# kỳ vọng: 201, body có id/email, KHÔNG có passwordHash

# 2. Đăng ký lại email cũ -> phải báo trùng
curl -i -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"a@a.com","password":"password123"}'
# kỳ vọng: 409, content-type application/problem+json

# 3. Đăng nhập, lưu cookie vào file cookies.txt
curl -i -c cookies.txt -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"a@a.com","password":"password123"}'
# kỳ vọng: 200 + header Set-Cookie

# 4. Dùng cookie đó gọi /auth/me
curl -i -b cookies.txt http://localhost:3000/auth/me
# kỳ vọng: 200, thấy lại email vừa đăng ký

# 5. Đăng xuất, gọi lại /auth/me -> phải bị chặn
curl -i -X POST http://localhost:3000/auth/logout -b cookies.txt
curl -i -b cookies.txt http://localhost:3000/auth/me
# kỳ vọng: 401 problem+json

# 6. Gửi thiếu field -> lỗi validate
curl -i -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" -d '{"password":"123"}'
# kỳ vọng: 400 problem+json, kèm mảng "errors" báo rõ field nào sai
```

## Phạm vi KHÔNG làm ở task này
Chưa viết Trip module (cần Auth xong trước, vì Trip cần `userId` để check quyền sở hữu).
