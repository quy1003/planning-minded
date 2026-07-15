# Task nhỏ #5 — Auth thật: đăng ký / đăng nhập / đăng xuất

> Trạng thái: **đã implement** — bạn tự curl test theo mục dưới. Task #6 (tests) làm sau.
> Cập nhật 2026-07-15: `packages/shared` hiện vẫn trống — schema auth sẽ tạo trong task này (doc cũ ghi “đã có sẵn” là sai so với source hiện tại).

## Task này làm gì?

Đây là task "lắp vòi nước" — dùng tất cả những gì đã setup (Config #1, Prisma #2, Redis #3, Session #4) để làm ra 4 endpoint thật:
- `POST /auth/register` — tạo user mới
- `POST /auth/login` — đăng nhập, tạo session
- `POST /auth/logout` — xóa session
- `GET /auth/me` — trả về user đang đăng nhập (dùng để test session còn sống hay không)

## Vì sao cần

Không có auth thì không làm được Trip CRUD (mọi trip phải gắn `userId` từ session, không lấy từ body). Phase 1 dùng **session cookie** (đơn giản để học); JWT EdDSA là Phase 2.

## Khái niệm mới (mức junior)

- **Hash password bằng `argon2id`** — **không bao giờ lưu password plaintext** vào DB. `argon2.hash` → chuỗi không đảo ngược; login dùng `argon2.verify(hash, password)`.
- **Contract ở `packages/shared`** — `registerSchema` / `loginSchema` (zod) sống ở shared để web + api dùng chung, không duplicate. Hiện `packages/shared/src/index.ts` còn `export {}` — task này sẽ thêm schemas.
- **Zod Validation Pipe** — “chốt chặn” NestJS: validate body **trước** khi vào service. Pipe nhận 1 zod schema bất kỳ.
- **Passport `LocalStrategy`** — chiến lược email+password. Bạn viết `validate()`; Passport đọc body, gắn user vào `req.user`.
- **`Guard`** — gác cổng route. `LocalAuthGuard` cho login; `SessionAuthGuard` chặn `/me` nếu chưa đăng nhập (`req.isAuthenticated()`).
- **`@CurrentUser()`** — decorator lấy `req.user` cho gọn.
- **RFC 9457 (`problem+json`)** — mọi lỗi HTTP cùng format: `{ type, title, status, detail, instance }` (+ `errors` khi validate fail).

## Dependencies cần cài thêm

Trong `@tripmind/api`:
- `argon2` — hash password
- `passport-local` + `@types/passport-local`
- (đã có: `passport`, `@nestjs/passport`, `express-session`, `zod`)

Trong `@tripmind/shared`:
- `zod` — để khai báo schema (api đã có zod; shared cần dependency riêng vì package độc lập)

## Cấu trúc thư mục auth (sau refactor)

```
auth/
  auth.controller.ts
  auth.service.ts
  auth.module.ts
  guards/          local-auth.guard.ts, session-auth.guard.ts
  strategies/      local.strategy.ts
  serializers/     session.serializer.ts
  utils/           password.util.ts
```

## Các bước nhỏ (thứ tự làm — mentor sẽ làm từng bước, dừng giải thích)

1. `packages/shared` — thêm `registerSchema` / `loginSchema` + export; wire package để api import được.
2. Cài deps (`argon2`, `passport-local`, …).
3. `apps/api/src/auth/utils/password.util.ts` — `hashPassword` / `verifyPassword`.
4. `apps/api/src/common/pipes/zod-validation.pipe.ts`
5. `apps/api/src/common/filters/http-exception.filter.ts` — RFC 9457; đăng ký global trong bootstrap.
6. `apps/api/src/common/decorators/current-user.decorator.ts`
7. `apps/api/src/auth/auth.service.ts` — `register`, `validateUser`, `findById` (không trả `passwordHash` ra ngoài).
8. `strategies/local.strategy.ts` + `guards/local-auth.guard.ts`
9. `serializers/session.serializer.ts` — session chỉ lưu `userId`.
10. `guards/session-auth.guard.ts`
11. `auth.controller.ts` — 4 endpoint.
12. Sửa `auth.module.ts` + gắn filter vào `configure-app` / `main`.
13. Cập nhật `prisma/seed.ts` — hash thật bằng argon2 cho user demo (password ghi trong comment seed, vd `password123`).

## Trade-off đã chọn

| Lựa chọn | Vì sao |
|---|---|
| Session cookie (không JWT) | Đúng Phase 1 roadmap; JWT EdDSA để Phase 2 |
| Schema ở `packages/shared` | Contract dùng chung, tránh duplicate khi có web |
| Không trả `passwordHash` trong response | Bảo mật cơ bản — không leak hash ra client |

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
