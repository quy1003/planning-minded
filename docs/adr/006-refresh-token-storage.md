# 006. Refresh token lưu trong Postgres, Redis chỉ làm revocation list

## Context

Task #4 (Phase 2 — refresh token rotation) ban đầu implement theo đúng
`docs/learning/40-refresh-token-rotation.md`: hash refresh token lưu thẳng
trong Redis (key `refresh:<hash>`, TTL 7 ngày) — đơn giản, Redis tự dọn khi
hết hạn.

Sau khi implement xong, phát hiện lệch với `docs/02-architecture.md` §3.2
(bản mô tả kiến trúc auth-service cuối cùng): doc đó định hash lưu **DB**,
Redis chỉ giữ **revocation list**. Thảo luận trade-off, ban đầu chọn giữ
Redis-only cho đơn giản (Phase 2 còn modular monolith, TTL đủ dùng).

Khi đọc tiếp kế hoạch task #5 (`docs/learning/41-refresh-token-revocation.md`,
"logout mọi thiết bị") và tìm hiểu pattern chuẩn production, lộ ra 2 vấn đề
thật của hướng Redis-only:

1. **Không tra ngược được theo user.** Redis lưu theo key `refresh:<hash>`
   — muốn biết "user X đang có những refresh token nào để revoke hết" phải
   tự maintain thêm 1 Redis Set phụ (`user-tokens:<userId>`), đồng bộ tay ở
   mọi chỗ issue/dùng/hết hạn token — dễ lệch dữ liệu nếu code sai 1 chỗ.
2. **Redis không đảm bảo bền.** Nếu Redis restart/bị evict (không bật
   persistence, hoặc dùng như cache có `maxmemory-policy`), refresh token
   hợp lệ (chưa hết hạn thật) biến mất → user bị đăng xuất oan dù chưa làm
   gì sai. DB (Postgres) không có rủi ro này.

## Decision

Lưu refresh token trong bảng Postgres `RefreshToken` (`tokenHash` unique,
`userId`, `createdAt`, `expiresAt`) — nguồn sự thật bền, tự nhiên hỗ trợ
`WHERE userId = X` (giải quyết thẳng vấn đề #1, task #5 không cần tự
maintain Redis Set nữa).

Redis không giữ token nữa — dành riêng cho **revocation list** (thiết kế cụ
thể để task #5 quyết định, hướng khả thi: key `revoked:<hash>` với TTL bằng
đúng thời gian còn lại tới `expiresAt`, dùng làm fast-path check + khả năng
revoke access token JWT còn hạn — chưa quyết định chi tiết ở ADR này).

## Consequences

- (+) Bền hơn Redis-only — restart/eviction Redis không làm mất refresh
  token hợp lệ.
- (+) Task #5 (revoke-all) query thẳng DB theo `userId`, không cần tự
  maintain index phụ trong Redis.
- (+) Có sẵn dữ liệu để sau này làm audit/"danh sách thiết bị đang đăng
  nhập" nếu cần (chưa làm UI/API, nhưng data đã có).
- (-) Thêm 1 Prisma model + migration — phức tạp hơn Redis-only.
- (-) Không còn tự dọn qua Redis TTL — token hết hạn vẫn nằm lại trong
  bảng, phải tự lọc `expiresAt` khi query (dọn định kỳ bằng cron là việc
  để sau, ngoài phạm vi task #4/#5 hiện tại).
- Đảo ngược quyết định "giữ Redis-only" đã ghi trong `docs/02-architecture.md`
  §3.2 và `docs/07-faq.md` — 2 file đó được cập nhật lại theo ADR này.
