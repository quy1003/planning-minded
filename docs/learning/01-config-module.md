# Task nhỏ #1 — Config Module (đọc & validate biến môi trường)

> Đọc xong file này, hiểu rồi thì báo tôi code. Chưa hiểu chỗ nào thì hỏi trước.

## Task này làm gì?

Thêm một "Config Module" vào `apps/api`: nơi duy nhất đọc các biến môi trường (`PORT`, `DATABASE_URL`, `REDIS_URL`, `SESSION_SECRET`), kiểm tra chúng có hợp lệ không (dùng thư viện `zod`), rồi cung cấp dữ liệu đó cho các phần khác của app dùng.

Đây là **task nhỏ đầu tiên** trong việc xây Auth module — mọi thứ sau này (kết nối database, session...) đều cần đọc biến môi trường, nên làm cái này trước, làm chắc, rồi mới xây tiếp.

## Vì sao cần?

1. Hiện tại `main.ts` đọc thẳng `process.env.PORT` ngay trong code. Nếu sau này có 5 chỗ khác cũng tự đọc `process.env.XXX` rải rác, khi đổi tên biến hoặc thiếu biến sẽ rất khó tìm lỗi.
2. `CLAUDE.md` (quy tắc dự án) yêu cầu: *"Env vars: khai báo + validate trong config module (zod). Không đọc `process.env` rải rác."*
3. **Fail-fast**: nếu thiếu `SESSION_SECRET` hoặc `DATABASE_URL` sai định dạng, ta muốn app **báo lỗi rõ ràng ngay lúc khởi động** (vd "SESSION_SECRET đang trống"), thay vì để app chạy được rồi lỗi tùm lum lúc có người dùng thật (lỗi khó debug hơn nhiều).

## Khái niệm mới (giải thích ngắn, mức junior)

- **NestJS Module**: một "hộp" gom nhóm các thứ liên quan nhau (ví dụ mọi thứ về "config" nằm trong 1 module). App của bạn là tập hợp nhiều module ghép lại (`AppModule` import `AuthModule`, `HealthModule`...).
- **Provider / `@Injectable()`**: 1 class được NestJS quản lý vòng đời — bạn không tự gõ `new ConfigService()`, mà NestJS tự tạo ra **đúng 1 lần** rồi "tiêm" (inject) vào bất cứ đâu cần nó qua constructor. Đây gọi là **Dependency Injection (DI)** — lợi ích: chỗ nào cần `ConfigService` chỉ cần khai báo trong constructor, không cần biết nó được tạo ra thế nào.
- **`@Global()`**: bình thường muốn dùng 1 module phải `import` nó vào module khác. Đánh dấu `@Global()` nghĩa là mọi module trong app đều tự động dùng được `ConfigService` mà không cần import lại — hợp lý vì gần như module nào cũng cần đọc config.
- **`zod`**: thư viện mô tả "hình dạng" dữ liệu mong muốn bằng code, ví dụ "PORT phải là số nguyên dương", rồi tự kiểm tra dữ liệu thật có khớp không, báo lỗi cụ thể nếu sai. Đã dùng zod cho `registerSchema`/`loginSchema` ở `packages/shared` rồi (nếu bạn từng thấy) — giờ dùng lại chính thư viện đó để validate env vars.

## Các bước nhỏ (thứ tự làm)

1. **`apps/api/src/config/env.schema.ts`** — định nghĩa "hình dạng" mong muốn của biến môi trường bằng zod (PORT là số, DATABASE_URL/REDIS_URL là URL hợp lệ, SESSION_SECRET tối thiểu 16 ký tự).
2. **`apps/api/src/config/config.service.ts`** — 1 class `@Injectable()`, trong constructor đọc `process.env` qua schema ở bước 1 **một lần duy nhất**; nếu sai thì `throw Error` với thông báo rõ ràng; nếu đúng thì lưu lại, cung cấp qua các getter như `configService.port`, `configService.databaseUrl`.
3. **`apps/api/src/config/config.module.ts`** — module `@Global()` khai báo `ConfigService` là provider và export nó ra.
4. **`apps/api/src/app.module.ts`** — thêm `ConfigModule` vào danh sách `imports`.
5. **`apps/api/src/main.ts`** — sửa `port = process.env.PORT` thành lấy từ `configService.port` (chứng minh module hoạt động).
6. Thêm `SESSION_SECRET=...` vào `.env` và `.env.example` (biến mới, chưa tồn tại).

## Cách bạn tự chạy/test sau khi code xong

```bash
# 1. Chạy app, health check vẫn phải hoạt động bình thường
pnpm --filter @tripmind/api dev
# mở tab khác:
curl http://localhost:3000/health
# kỳ vọng: {"status":"ok"}

# 2. Thử phá: xóa/comment dòng SESSION_SECRET trong .env, chạy lại `pnpm --filter @tripmind/api dev`
# kỳ vọng: app KHÔNG chạy lên được, in ra lỗi rõ ràng kiểu "SESSION_SECRET phải dài ít nhất 16 ký tự"
# rồi thêm lại SESSION_SECRET, chạy lại, app lên bình thường -> chứng minh validate hoạt động đúng
```

## Phạm vi KHÔNG làm ở task này

Chưa đụng tới Prisma, Redis, hay Auth logic — những cái đó là các task nhỏ tiếp theo, sau khi Config Module này chạy ổn và bạn đã hiểu rõ.

---
Đọc xong, hiểu rồi thì báo tôi để tôi bắt đầu code (từng bước, dừng lại giải thích sau mỗi bước).
