# CLAUDE.md — TripMind
<!-- Đặt file này ở root repo. Claude Code tự đọc mỗi phiên. -->

## Project
AI trip planner. Monorepo pnpm + Turborepo. Docs nguồn sự thật: `docs/01-requirements.md`, `docs/02-architecture.md`, `docs/03-roadmap.md`. Đọc chúng trước khi làm task lớn. Thắc mắc "vì sao chọn X" → tra `docs/07-faq.md` trước khi hỏi lại; nếu không có, trả lời rồi thêm mục mới vào đó.

## Bối cảnh quan trọng
Đây là **dự án học tập** — người chủ repo đang học các công nghệ này. Vì vậy:
- Khi dùng pattern/khái niệm không hiển nhiên, thêm 1–2 dòng giải thích trong câu trả lời (không spam comment trong code).
- Ưu tiên giải pháp rõ ràng, dễ đọc hơn giải pháp "thông minh".
- Khi có nhiều cách làm, nêu trade-off ngắn gọn rồi đề xuất một cách.

## Commands
```bash
pnpm dev                 # toàn stack (turbo)
pnpm test                # unit tests
pnpm test:integration    # cần docker
pnpm lint && pnpm typecheck
docker compose -f infra/docker-compose.yml up -d
pnpm --filter <app> <cmd>   # chạy riêng 1 app, vd: pnpm --filter auth-service test
```

## Cấu trúc
`apps/*` = Next.js web + các NestJS services (api-gateway, auth, trip, catalog, ai, notification). `packages/shared` = DTOs, zod schemas, event contracts — **mọi contract liên service phải khai báo ở đây**, không duplicate.

## Conventions
- TypeScript strict, không `any` (dùng `unknown` + narrow).
- Validation ở biên: mọi input qua zod/class-validator DTO. Error format: RFC 9457 problem+json.
- NestJS: 1 module/domain; controller mỏng, logic trong service; repository qua Prisma.
- Naming: files kebab-case, class PascalCase. Commits: conventional commits (`feat(auth): ...`).
- Tests: mỗi feature mới PHẢI có tests. Unit cạnh source `*.spec.ts`; integration dùng Testcontainers, không mock DB.
- Env vars: khai báo + validate trong `config` module của mỗi service (zod). Không đọc `process.env` rải rác.
- Không commit secrets. Không log PII/tokens.

## Security (nghiêm ngặt)
- JWT: EdDSA, verify bằng JWKS của auth-service. KHÔNG bao giờ dùng HS256 hay hardcode key.
- Password: argon2id. Refresh tokens: hash trước khi lưu, rotation bắt buộc.
- Mọi endpoint mutation: auth guard + ownership check (`userId` từ token, không từ body).
- Thay đổi liên quan auth → nhắc tôi chạy /security-review trước khi merge.

## Workflow
- Task vừa/lớn: đề xuất plan trước khi sửa code.
- Sau khi code: tự chạy `pnpm lint && pnpm typecheck && pnpm test` và sửa đến khi pass.
- Quyết định kiến trúc mới → viết ADR vào `docs/adr/`.
- Không refactor ngoài phạm vi task nếu tôi không yêu cầu.
