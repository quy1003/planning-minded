# Auth Module — Danh sách task nhỏ (Phase 1)

> Mục tiêu chung: user đăng ký/đăng nhập/đăng xuất bằng session (chưa phải JWT — đó là Phase 2). Xem `docs/03-roadmap.md`.
> Quy tắc làm việc: xem "Cách làm việc: dạy-học" trong `CLAUDE.md` — đọc file task trước, hiểu rồi mới code, từng bước có giải thích.

| # | Task | File | Trạng thái |
|---|---|---|---|
| 1 | Config Module (đọc & validate biến môi trường) | [01-config-module.md](01-config-module.md) | ✅ Xong |
| 2 | Kết nối Database bằng Prisma | [02-prisma-setup.md](02-prisma-setup.md) | ⬜ Chưa làm |
| 3 | Kết nối Redis | [03-redis-connection.md](03-redis-connection.md) | ⬜ Chưa làm |
| 4 | Session Bootstrap (cookie đăng nhập) | [04-session-bootstrap.md](04-session-bootstrap.md) | ⬜ Chưa làm |
| 5 | Auth thật: đăng ký/đăng nhập/đăng xuất | [05-auth-logic.md](05-auth-logic.md) | ⬜ Chưa làm |
| 6 | Test (unit + integration) | [06-testing.md](06-testing.md) | ⬜ Chưa làm |

Sau khi xong cả 6, Auth module coi như hoàn thiện — bước tiếp theo là Trip CRUD (file học sẽ viết khi tới lúc đó).
