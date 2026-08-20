# 013. Gộp `JwtAuthGuard` vào `packages/shared` — xoá duplicate 5 bản

## Context

`JwtAuthGuard` (verify JWT offline qua JWKS) bị duplicate y hệt ở 5 nơi: `auth-service`,
`apps/api`, `trip-service`, `catalog-service`, `api-gateway` — mỗi lần tách/thêm service mới
(Phase 2 task #7, Phase 3 task #2-#4) đều copy tay nguyên file. Rủi ro thật: đây là code bảo
mật (verify chữ ký JWT) — sửa 1 chỗ (vd vá lỗ hổng) quên sửa chỗ khác thì service đó âm thầm
giữ lỗ hổng cũ. Phát hiện ra khi review lại kiến trúc `api-gateway` (task #4) và bị hỏi thẳng:
*"lỡ 1 thằng sửa thằng kia không sửa thì lệch nhau à?"*

## Decision

### 1. Đưa `JwtAuthGuard` thành class thật trong `packages/shared`, không còn duplicate

`packages/shared` trước giờ chỉ chứa type/zod schema (không phụ thuộc runtime nào ngoài
`zod`) — lần đầu tiên đựng 1 class NestJS thật (`@Injectable()`), nên thêm `@nestjs/common`,
`jose` làm dependency thật (không còn chỉ "chứa type" nữa — đổi vai trò package này, cân nhắc
kỹ trước khi làm, không phải chuyện nhỏ).

### 2. DI xuyên app: dùng injection token (`JWKS_URL`), không dùng thẳng `ConfigService`

Guard cần biết URL JWKS, nhưng mỗi app có **`ConfigService` khác nhau** (5 class riêng biệt,
không dùng chung được). Giải pháp: `JwtAuthGuard` nhận `@Inject(JWKS_URL) jwksUrl: string`
(token là 1 `Symbol` export từ `packages/shared`) thay vì nhận thẳng `ConfigService`. Mỗi app
tự "nối dây" trong `auth.module.ts` của chính nó:

```ts
providers: [
  JwtAuthGuard,
  { provide: JWKS_URL, useFactory: (config: ConfigService) => config.jwksUrl, inject: [ConfigService] },
],
exports: [JwtAuthGuard, JWKS_URL],   // JWKS_URL PHẢI export cùng — xem bug ở mục 4
```

Guard ở `packages/shared` không biết và không cần biết app nào đang chạy — chỉ cần biết
"JWKS lấy ở URL nào", đúng nguyên tắc tách phần dùng chung khỏi phần đặc thù từng app.

### 3. Type `Request.jwtUser` — global augmentation nằm CHUNG file với guard, không tách `.d.ts` riêng

Thử tách `declare global {...}` ra file `.d.ts` riêng (`express-request.d.ts`), import
side-effect từ `index.ts` (`import "./auth/express-request"`) — **lỗi thật lúc chạy**: file
`.d.ts` không có bản `.js` tương ứng, `tsc` compile `index.ts` thành `require("./auth/express-request")`
trỏ tới file không tồn tại → `MODULE_NOT_FOUND` ngay khi bất kỳ app nào `import` từ
`@tripmind/shared`. Sửa bằng cách giữ `declare global` **trong cùng file `.ts`** với
`JwtAuthGuard` (file này chắc chắn có `.js` thật vì có code chạy) — mọi app import
`JwtAuthGuard` tự động kéo theo type augmentation, không cần side-effect import riêng.

ESLint (`@typescript-eslint/no-namespace`) mặc định chỉ cho phép `namespace` trong file
`.d.ts` — file `.ts` thường như trên phải tự tắt rule bằng
`// eslint-disable-next-line @typescript-eslint/no-namespace` (không có cú pháp ES2015 module
nào thay thế được cho việc augment 1 namespace global có sẵn như `Express`).

### 4. Bug DI thật gặp phải: export thiếu `JWKS_URL`, chỉ export `JwtAuthGuard`

Lần đầu chỉ `exports: [JwtAuthGuard]` (thiếu `JWKS_URL`) — mọi thứ build/typecheck sạch,
nhưng **runtime lỗi ngay** khi `TripModule`/`CatalogModule` (module import `AuthModule`) cố
dùng `@UseGuards(JwtAuthGuard)` trong controller của chính nó:

```
Nest can't resolve dependencies of the JwtAuthGuard (?). Please make sure that the argument
Symbol(JWKS_URL) at index [0] is available in the TripModule module.
```

Lý do: khi `@UseGuards(SomeClass)` nhận 1 **class reference** (không phải instance), NestJS
resolve guard đó (và MỌI dependency của guard) trong phạm vi container của **module khai báo
controller đang dùng guard** (ở đây là `TripModule`), không tự động "mượn" toàn bộ context DI
của module gốc định nghĩa guard (`AuthModule`) — dù `TripModule` đã `imports: [AuthModule]`.
`imports` chỉ cho `TripModule` **thấy** các provider mà `AuthModule` **export tường minh** —
`JwtAuthGuard` phụ thuộc `JWKS_URL`, nên `JWKS_URL` cũng phải nằm trong `exports` thì
`TripModule` mới đủ thấy để tự resolve trọn vẹn chuỗi dependency. Đây không phải trực giác rõ
ràng — chỉ phát hiện được qua integration test thật (unit test không bắt được vì không thật sự
boot `Test.createTestingModule` với 2 module lồng nhau).

## Consequences

- (+) 5 bản duplicate → 1 file duy nhất (`packages/shared/src/auth/jwt-auth.guard.ts`) — sửa
  1 chỗ, mọi service tự động nhận qua `@tripmind/shared`, không còn rủi ro lệch.
- (+) Bug thật (mục 3, 4) đã bắt được và ghi lại — lần sau thêm provider dùng chung xuyên
  module (không chỉ guard) sẽ nhớ: **export cả provider chính lẫn mọi dependency nó cần**,
  không chỉ provider "công khai" nhất.
- (-) `packages/shared` giờ có runtime dependency thật (`@nestjs/common`, `jose`) — không còn
  thuần "chỉ chứa type" nữa. Nếu tương lai có service không dùng NestJS (khả năng thấp), gói
  này không còn "dùng chung" theo nghĩa gọn.
- `AdminGuard` (catalog-service) **chưa** gộp — hiện chỉ 1 nơi dùng, không có rủi ro duplicate
  thật để giải quyết (đúng nguyên tắc không xây trước cho nhu cầu chưa tồn tại). Gộp khi có
  service thứ 2 cần nó.
