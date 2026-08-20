# 012. `api-gateway` — cửa ngõ duy nhất, proxy bằng NestJS controller + HttpService (Phase 3 task #4)

## Context

`docs/03-roadmap.md` Phase 3 yêu cầu thêm `api-gateway`. Trước task này, `apps/web` tự rewrite
thẳng tới từng service (`next.config.ts`, task #1-#3) — không có điểm tập trung nào verify
JWT/log/route. Kế hoạch đầy đủ: `docs/learning/50-api-gateway.md`.

## Decision

### 1. Cơ chế proxy: NestJS controller + `@nestjs/axios` (`HttpService`), không dùng `http-proxy-middleware`

`http-proxy-middleware` là middleware Express thuần, chạy trước khi Nest route vào controller
— không gắn được `JwtAuthGuard` (một `CanActivate` của Nest) vào giữa luồng theo cách tự nhiên,
phải viết lại logic verify JWT thành middleware riêng, tách khỏi pattern guard/pipe/filter/
interceptor toàn bộ codebase đang dùng. Chọn 1 `ProxyController` dùng `@Res()` tự quản response
+ `ProxyService` (wrap `HttpService`) forward request — vẫn nằm trong vòng đời request của Nest,
`JwtAuthGuard` chạy bình thường như mọi controller khác.

### 2. Route pattern: path-to-regexp v8 (Express 5) — wildcard không tự khớp path trần

Bug thật gặp phải lúc code: `@All("trips/*path")` chỉ khớp `/trips/<gì đó>`, **không khớp
`/trips` trần** (path-to-regexp v8 — Express 5/NestJS 11 mặc định — bắt buộc wildcard có ít
nhất 1 segment). Integration test bắt được ngay: `GET /v1/trips` (không token) lẽ ra phải bị
gateway chặn 401 lại lọt xuống route fallback (200, tới thẳng `apps/api`) vì Nest match `*path`
(fallback) trước khi thấy `trips/*path` "không khớp". Sửa bằng khai 2 pattern cho mỗi route:
`@All(["trips", "trips/*path"])` — áp dụng cho cả `auth`, `trips`, `destinations`.

### 3. Gateway KHÔNG tự `enableVersioning()` — "v1" là literal path segment

Mọi service khác tự sở hữu version của chính nó qua `app.enableVersioning(...)`. Gateway không
"sở hữu" version nào — nó chỉ forward nguyên `req.originalUrl` (đã có sẵn `/v1/...` do browser
gửi) sang service đích, dùng thẳng `@Controller("v1")` với path literal thay vì cơ chế versioning
của Nest (tránh Nest tự "hiểu" và có thể strip/biến đổi path theo cách không cần thiết ở đây).

### 4. JWT verify: chỉ gắn `JwtAuthGuard` cho `/trips/*`, KHÔNG gắn cho `/auth/*` và `/destinations/*`

Đã quyết định "hướng B" (defense in depth, xem `50-api-gateway.md`) — nhưng KHÔNG áp dụng đồng
loạt cho mọi route. `/trips/*` 100% route đều cần login (mọi controller trip-service đều có
`@UseGuards(JwtAuthGuard)`) — gateway chặn sớm an toàn tuyệt đối. `/auth/*` và `/destinations/*`
có **route công khai lẫn route cần quyền trong CÙNG 1 prefix** (vd `POST /auth/login` công khai,
`GET /auth/me` cần JWT; `GET /destinations` công khai, `POST /destinations` cần admin) — gắn
guard chung ở gateway cho cả prefix sẽ chặn nhầm route công khai (bug, không phải tính năng).
2 prefix này để nguyên cho service phía sau tự quyết bằng guard riêng của nó — đúng tinh thần
"mỗi service tự chịu trách nhiệm cuối cùng cho route của nó", gateway chỉ thêm lớp chặn sớm ở
nơi làm được mà không phá gì.

### 5. "Production practice" thêm vào task này (không mở rộng sang task #5-#8)

- **Timeout 10s/request** — không để gateway treo vô hạn nếu service đích không phản hồi. Khác
  circuit breaker (task #8): timeout chỉ giới hạn 1 request, không nhớ trạng thái "service đang
  chết" giữa nhiều request — circuit breaker xây trên nền timeout này sau, không làm ở đây.
- **`X-Request-Id`** — tôn trọng header có sẵn (nếu hạ tầng trước gateway đã gắn), tự sinh nếu
  chưa có, forward xuống service đích + trả lại cho client + gắn vào mọi dòng log gateway. Tiền
  đề rẻ tiền cho distributed tracing thật (OpenTelemetry, Phase 5) — chưa làm OTel ở đây.
- **Structured log mỗi request** (method, path đích, status, thời gian, request id) qua
  `Logger` có sẵn của Nest.
- **KHÔNG làm** (đúng phạm vi task, để dành task khác): rate limit tổng, network isolation
  (task #7), gRPC (task #5), circuit breaker (task #8).

### 6. Forward `Set-Cookie` — điểm dễ bug nhất, có test riêng

`ProxyService` copy toàn bộ response header từ service đích về (trừ `connection`/
`transfer-encoding`/`content-encoding` — hop-by-hop, không nên forward nguyên văn). Thiếu bước
này thì refresh token cookie (`tripmind.rt`, do `auth-service` set) không bao giờ tới được
browser qua gateway — login vẫn "thành công" (200 + accessToken) nhưng session không sống sót
qua lần reload trang. Integration test (`gateway.integration-spec.ts`) assert riêng case này.

## Consequences

- (+) `apps/web/next.config.ts` giờ chỉ 1 rule rewrite — routing table (auth/trips/destinations
  đi service nào) sống ở đúng 1 chỗ (`api-gateway`), không rải rác 2 nơi (Next + tương lai
  gateway) như trước.
- (+) Integration test bắt được bug path-to-regexp thật (mục 2) — nếu không có test này, bug sẽ
  chỉ lộ ra khi test tay `curl /api/v1/trips` không có query/path con, dễ bỏ sót.
- (-) `req.body` đã qua body-parser của Nest (parse thành JS object) trước khi tới
  `ProxyService` — forward lại nghĩa là re-serialize JSON, không phải forward byte-nguyên-văn.
  Chấp nhận được vì mọi payload trong app này là JSON nhỏ (không có upload file) — ghi lại đây
  để không quên nếu sau này cần forward payload nhị phân.
- Vẫn còn nợ kỹ thuật đã biết: `/auth/*` và `/destinations/*` không được gateway pre-check JWT
  — chấp nhận được vì lý do ở mục 4 (route công khai/cần quyền trộn lẫn), nhưng nghĩa là mọi
  request tới 2 prefix này vẫn phải đi hết vòng network tới service đích rồi mới biết có hợp lệ
  hay không (không tối ưu round-trip như `/trips/*`).
