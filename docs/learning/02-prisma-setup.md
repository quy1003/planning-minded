# Task nhỏ #2 — Kết nối Database bằng Prisma

> Đọc xong hiểu rồi báo tôi. Đây là task bạn nói chưa rành — mình giải thích kỹ hơn bình thường.

## Task này làm gì?

Cho `apps/api` biết cách kết nối tới Postgres (đã chạy sẵn trong Docker), định nghĩa bảng `users` đầu tiên, và tạo 1 "service" để các phần code khác (Auth sau này) dùng để đọc/ghi database.

## Vì sao cần Prisma? ORM là gì?

Không dùng Prisma, muốn lưu 1 user bạn phải tự viết SQL thô:
```sql
INSERT INTO users (id, email, password_hash) VALUES ($1, $2, $3);
```
rồi tự parse kết quả trả về, tự lo kiểu dữ liệu (string, number, date...) khớp đúng cột. Dễ gõ sai tên cột, sai kiểu, và TypeScript không giúp được gì vì SQL chỉ là 1 chuỗi string.

**Prisma = ORM** (Object-Relational Mapper) — cầu nối giữa "bảng SQL" và "object TypeScript". Bạn mô tả cấu trúc database 1 lần trong file `schema.prisma`, Prisma tự sinh ra code TypeScript **có kiểu dữ liệu đầy đủ**, để bạn viết:
```ts
await prisma.user.create({ data: { email: "a@a.com", passwordHash: "..." } });
```
— TypeScript tự biết `email` phải là string, báo lỗi ngay lúc gõ code nếu bạn quên field bắt buộc, thay vì lỗi lúc chạy.

## 3 khái niệm hay bị nhầm: `schema.prisma`, `generate`, `migrate`

### 1. `schema.prisma` — bản thiết kế
Một file duy nhất, 3 phần:
```prisma
datasource db {              // "Database thật nằm ở đâu"
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {           // "Sinh code TypeScript kiểu gì"
  provider = "prisma-client-js"
}

model User {                 // "Bảng users có những cột gì" — đây là bản thiết kế
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String
  ...
}
```
File này **chỉ là bản thiết kế trên giấy** — chưa làm gì tới database thật hay code thật cả. 2 lệnh dưới đây mới là hành động thật.

### 2. `npx prisma generate` — "Sinh code TypeScript, KHÔNG đụng vào database"
Đọc `schema.prisma`, sinh ra 1 bộ code TypeScript (class `PrismaClient` với đầy đủ kiểu dữ liệu cho `user.findUnique()`, `user.create()`...) rồi bỏ vào `node_modules/@prisma/client`.

- **Không kết nối database thật**, không cần Postgres đang chạy.
- Chạy lại lệnh này **mỗi khi bạn sửa `schema.prisma`** — để code TypeScript khớp với thiết kế mới.
- Ví dụ: bạn thêm field `avatarUrl` vào `model User`, chạy `generate` xong thì `prisma.user.create({ data: { avatarUrl: "..." } })` mới được TypeScript nhận diện.

### 3. `npx prisma migrate dev --name init_user` — "Thực sự tạo bảng trong Postgres"
So sánh `schema.prisma` (thiết kế) với cấu trúc **hiện tại** của database thật, tính ra phần khác biệt, sinh 1 file SQL (`CREATE TABLE users (...)`) rồi **chạy file SQL đó lên Postgres thật** — bảng `users` giờ mới thực sự tồn tại.

- **Có đụng vào database thật** — cần Postgres đang chạy (`docker compose up -d`).
- Lệnh này tự động chạy `generate` luôn ở cuối, nên thường bạn chỉ cần gõ `migrate dev`, không cần gõ `generate` riêng — trừ khi máy khác (đồng nghiệp, CI) đã có sẵn bảng rồi, chỉ cần code, lúc đó chỉ cần `generate` thôi.
- File SQL sinh ra nằm ở `prisma/migrations/<timestamp>_init_user/migration.sql` — **file này được commit vào git**. Đây là "nhật ký" mọi thay đổi cấu trúc database qua thời gian. Sau này lên production, dùng `prisma migrate deploy` (không phải `dev`) để chạy đúng các file này theo thứ tự, không hỏi gì thêm (khác `dev` là mode dành cho máy bạn tự code, có thể hỏi xác nhận).

**Tóm tắt 1 câu:** `generate` = cập nhật *code TypeScript*; `migrate` = cập nhật *database thật* (và tiện thể cũng generate luôn).

## Các bước nhỏ (thứ tự làm)

1. **`apps/api/prisma/schema.prisma`** — viết datasource (trỏ `DATABASE_URL` — đã có sẵn từ Task #1), generator, và `model User` (id, email, passwordHash, name, avatarUrl, preferences, createdAt, updatedAt).
2. Cài `@prisma/client` (dependency) + `prisma` (devDependency, đây là CLI dùng để chạy lệnh `generate`/`migrate`).
3. `docker compose -f infra/docker-compose.yml up -d` — đảm bảo Postgres đang chạy (nếu tắt máy/tắt Docker thì phải bật lại).
4. Chạy `npx prisma migrate dev --name init_user` (từ trong `apps/api/`) — tạo bảng `users` thật + sinh code.
5. **`apps/api/src/prisma/prisma.service.ts`** — 1 class `@Injectable()` kế thừa `PrismaClient`, tự `$connect()` lúc app khởi động (`OnModuleInit`) và `$disconnect()` lúc app tắt (`OnModuleDestroy`) — để không rò rỉ connection.
6. **`apps/api/src/prisma/prisma.module.ts`** — `@Global()` module, export `PrismaService` (giống hệt pattern `ConfigModule` ở Task #1, bạn đã quen rồi).
7. Wire `PrismaModule` vào `app.module.ts`.
8. **`apps/api/prisma/seed.ts`** — script chèn dữ liệu mẫu (dùng `upsert`, không phải `create`, để chạy lại nhiều lần không lỗi trùng). Khai báo ở `package.json` field `"prisma": { "seed": "ts-node prisma/seed.ts" }` — Prisma tự nhận diện và **tự chạy seed sau mỗi lần `migrate dev`/`migrate reset`**. Chạy tay: `pnpm prisma:seed`.
   > Quy tắc từ giờ: **mỗi khi thêm/sửa 1 model mới trong `schema.prisma`**, cập nhật luôn `seed.ts` để có data mẫu tương ứng — đừng để riêng model mới không có gì trong seed.

## Cách bạn tự test sau khi xong

```bash
# 1. Chắc chắn Postgres đang chạy
docker compose -f infra/docker-compose.yml up -d
docker ps   # phải thấy tripmind-postgres-1 "healthy"

# 2. Chạy migration
cd apps/api
npx prisma migrate dev --name init_user
# kỳ vọng: in ra "Applying migration ..." rồi "Your database is now in sync with your schema."

# 3. Xem thử bảng đã tạo thật chưa (2 cách chọn 1):
npx prisma studio
# mở ra 1 trang web (thường http://localhost:5555) cho xem/sửa data trực quan — thấy bảng "User" trống là đúng

# hoặc dùng psql trong container:
docker exec -it tripmind-postgres-1 psql -U tripmind -d tripmind -c "\dt"
# kỳ vọng: thấy bảng "users" trong danh sách

# 4. App vẫn chạy bình thường (Prisma chỉ mới kết nối, chưa dùng ở đâu)
pnpm --filter @tripmind/api dev
curl http://localhost:3000/health
```

## Phạm vi KHÔNG làm ở task này
Chưa viết `AuthService` hay bất kỳ chỗ nào thực sự gọi `prisma.user.create(...)` — task này chỉ dừng ở "kết nối được, bảng đã tồn tại". Dùng nó là các task sau (#5).
