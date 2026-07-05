# Workflow: Dùng Claude Code cho toàn bộ SDLC

> Áp dụng cho TripMind nhưng dùng được cho mọi dự án.

## 0. Cài đặt
```bash
npm install -g @anthropic-ai/claude-code
cd tripmind && claude
```
Lệnh/phím quan trọng: `Shift+Tab` (đổi mode: normal → auto-accept → **plan mode**), `/init` (sinh CLAUDE.md), `/clear` (reset context giữa các task), `Esc` (ngắt), `/review`, `/security-review`.

## 1. Giai đoạn Requirements
Copy `01-requirements.md` vào `docs/` của repo. Khi cần đào sâu:
> "Đọc docs/01-requirements.md. Với Epic B, hãy đóng vai product owner và chất vấn tôi 5 câu về edge cases mà spec chưa cover, rồi cập nhật file."

## 2. Giai đoạn Architecture — dùng Plan Mode
Bật Plan mode (Shift+Tab x2) để Claude **chỉ đề xuất, không sửa code**:
> "Đọc docs/02-architecture.md. Lập kế hoạch implement Phase 2 (auth-service với EdDSA JWT + JWKS). Liệt kê files sẽ tạo, thứ tự, và rủi ro."

Duyệt plan trước, rồi mới cho thực thi. Sau mỗi quyết định lớn:
> "Viết ADR docs/adr/003-eddsa-jwt.md cho quyết định vừa rồi theo format context/decision/consequences."

## 3. Tạo repo & scaffold
```
> Khởi tạo monorepo theo docs/02-architecture.md mục 7: pnpm workspaces + Turborepo,
  packages/config với tsconfig/eslint dùng chung, docker-compose có postgres+redis,
  GitHub Actions chạy lint+typecheck+test. Sau đó chạy /init để tạo CLAUDE.md.
```
Rồi thay CLAUDE.md bằng template kèm theo (`05-CLAUDE.md`) — file này là "bộ nhớ" của Claude Code, quyết định chất lượng code nó viết.

## 4. Agent Coding — quy tắc vàng
- **Task nhỏ, context sạch:** mỗi task 1 phiên, xong thì `/clear`. Task lý tưởng = 1 PR reviewable.
- **Plan trước khi code** với task ≥ trung bình.
- **TDD với AI cực hiệu quả:**
  > "Viết tests cho refresh token rotation theo acceptance criteria trong docs/01-requirements.md Epic A5. Chưa viết implementation. Tôi review tests xong mới code."
- **Bắt Claude tự verify:** "chạy `pnpm test` và `pnpm lint`, sửa cho đến khi pass."
- **Học trong lúc code** (quan trọng với bạn):
  > "Trước khi code, giải thích cho tôi JWKS là gì và tại sao service khác verify được token mà không gọi auth-service. Sau khi code xong, tóm tắt 3 điểm tôi nên nhớ."
- Việc dài (migrate, refactor lớn): dùng subagents — "dùng một agent riêng để viết tests cho catalog-service trong khi agent chính làm trip-service."

## 5. Git workflow
```
main ← PR ← feature/phase2-auth-jwks
```
> "Tạo branch feature/..., commit theo conventional commits, viết PR description tóm tắt thay đổi + cách test."
Claude Code thao tác git/gh CLI trực tiếp. Trên PR: chạy `/review` và `/security-review` (bắt buộc với code auth).

## 6. Testing
- Unit: cạnh source (`*.spec.ts`), mock ở boundary.
- Integration: Testcontainers (Postgres/Redis/RabbitMQ thật trong Docker).
- E2E: Playwright cho 3 flows chính (auth, tạo plan, lưu trip).
- Prompt hữu ích: "Coverage report đây, viết thêm tests cho các nhánh chưa cover trong token.service.ts, ưu tiên error paths."

## 7. Documentation
Cuối mỗi phase:
> "Cập nhật README của các service đã đổi, sinh lại OpenAPI spec, cập nhật docs/02-architecture.md nếu thực tế khác thiết kế, và viết docs/learning-log/phase-N.md tóm tắt các khái niệm đã dùng."

## 8. Vòng lặp chuẩn cho mỗi task (in ra dán cạnh màn hình)
```
1. /clear
2. "Đọc CLAUDE.md và docs/03-roadmap.md. Task hôm nay: <X>"
3. Plan mode → duyệt plan
4. Tests trước (nếu là logic) → implementation
5. "Chạy test + lint, sửa đến khi pass"
6. Tự đọc diff, hỏi những gì chưa hiểu
7. Commit, PR, /review
8. Cập nhật docs nếu cần
```
