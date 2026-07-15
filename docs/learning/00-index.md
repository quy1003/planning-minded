# Auth + Trip — Danh sách task nhỏ (Phase 1)

> Mục tiêu Auth: đăng ký/đăng nhập/đăng xuất bằng session (chưa JWT — Phase 2).  
> Mục tiêu Trip: CRUD trip + places thủ công. Xem `docs/03-roadmap.md`.  
> Quy tắc: `CLAUDE.md` — đọc file task trước, hiểu rồi mới code.

## Auth module

| # | Task | File | Trạng thái |
|---|---|---|---|
| 1 | Config Module | [01-config-module.md](01-config-module.md) | ✅ |
| 2 | Prisma | [02-prisma-setup.md](02-prisma-setup.md) | ✅ |
| 3 | Redis | [03-redis-connection.md](03-redis-connection.md) | ✅ |
| 4 | Session bootstrap | [04-session-bootstrap.md](04-session-bootstrap.md) | ✅ |
| 5 | Auth logic | [05-auth-logic.md](05-auth-logic.md) | ✅ |
| 6 | Auth tests | [06-testing.md](06-testing.md) | ✅ |
| 7 | Response format | [07-response-format.md](07-response-format.md) | ✅ |
| — | **Auth session (đọc file này là đủ)** | [09-auth-session-flow.md](09-auth-session-flow.md) | ✅ đã viết gọn lại |

## Trip module

| # | Task | File | Trạng thái |
|---|---|---|---|
| 8 | Trip CRUD + Places (+ bài giảng) | [08-trip-crud.md](08-trip-crud.md) | ✅ A+B · ⬜ C itinerary API |

Sau Phần C itinerary → có thể làm Next.js web + map.
