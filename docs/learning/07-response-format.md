# Task — Unified API response (success + business/system errors)

> Trạng thái: implement theo yêu cầu (2026-07-15). Nhật ký: `docs/diary.md`.

## Làm gì?

Thống nhất 2 “hình dạng” response:

### Success
```json
{ "data": { "...": "payload từ controller" } }
```
Interceptor bọc mọi response thành công. **Không** bọc `204 No Content` (logout).

### Error (giữ RFC 9457 problem+json)
```json
{
  "type": "https://httpstatuses.com/409",
  "title": "Conflict",
  "status": 409,
  "detail": "Email already registered",
  "instance": "/auth/register",
  "category": "business",
  "errors": []
}
```

| `category` | Khi nào | Ví dụ |
|---|---|---|
| `business` | Lỗi nghiệp vụ / input — HTTP 4xx | email trùng, sai password, validate fail |
| `system` | Lỗi hệ thống / bất ngờ — HTTP 5xx | DB sập, bug chưa bắt; **log** stack, client chỉ thấy message chung |

## Trade-off đã chọn

- **Không** gộp success/error vào một envelope `{ success: true/false }` — vì `CLAUDE.md` đã chốt lỗi = problem+json; success chỉ thêm `{ data }`.
- `category` là **extension** của RFC 9457 (field thêm, vẫn hợp lệ).

## File sẽ đụng

1. `common/interceptors/transform.interceptor.ts` — bọc success
2. `common/filters/http-exception.filter.ts` — thêm `category` + Logger cho system
3. `common/exceptions/business.exception.ts` — helper ném lỗi business rõ ràng (auth có thể dùng dần)
4. `bootstrap/configure-app.ts` — `useGlobalInterceptors`
5. Cập nhật integration tests → đọc `res.body.data`
6. Cập nhật `docs/diary.md` + FAQ ngắn
