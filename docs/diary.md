# Nhật ký dự án TripMind

> File theo dõi tiến độ — cập nhật mỗi khi xong một phần (scaffold / setup / feature / refactor / test).
> Chi tiết kỹ thuật từng task auth: `docs/learning/00-index.md`.

## Cách đọc

| Cột | Ý nghĩa |
|---|---|
| Phase | Theo `docs/03-roadmap.md` |
| Loại | scaffold · setup · tích hợp · feature · refactor · test · docs |
| Trạng thái | ✅ xong · 🚧 đang làm · ⬜ chưa |

---

## Timeline

### Phase 0 — Nền móng

| Ngày (ước) | Loại | Việc | Ghi chú |
|---|---|---|---|
| — | scaffold | Monorepo pnpm + Turborepo | `apps/*`, `packages/*`, root scripts |
| — | scaffold | `packages/config` (tsconfig / eslint / prettier) | Dùng chung |
| — | scaffold | `apps/api` NestJS skeleton | `HealthModule`, `GET /health` |
| — | scaffold | `packages/shared` placeholder | Barrel export trống |
| — | setup | Docker Compose: Postgres 17 + Redis 7 | `infra/docker-compose.yml`, PG port **5433** |
| — | setup | CI GitHub Actions (lint / typecheck) | `.github/workflows/ci.yml` |
| — | docs | Requirements, architecture, roadmap, FAQ, CLAUDE.md | `docs/01`–`07` |

### Phase 1 — Modular monolith · Auth (Task #1 → #6)

| # | Loại | Việc | File học | TT |
|---|---|---|---|---|
| 1 | setup | ConfigModule + Zod validate env | `learning/01-config-module.md` | ✅ |
| 2 | tích hợp | Prisma + model `User` + migration + seed | `learning/02-prisma-setup.md` | ✅ |
| 3 | tích hợp | RedisModule / RedisService | `learning/03-redis-connection.md` | ✅ |
| 4 | setup | Session cookie + Passport init (`configure-app.ts`) | `learning/04-session-bootstrap.md` | ✅ |
| 5 | feature | Auth thật: register / login / logout / me (session + argon2id) | `learning/05-auth-logic.md` | ✅ |
| 5b | tích hợp | `@tripmind/shared` schemas + build `dist/` | `packages/shared` | ✅ |
| 5c | refactor | Auth folder chuẩn: `guards/` `strategies/` `serializers/` `utils/` | — | ✅ |
| 6 | test | Unit + integration (Testcontainers) cho Auth | `learning/06-testing.md` | ✅ |

### Phase 1 — Tiếp theo (chưa làm)

| Loại | Việc | TT |
|---|---|---|
| feature | Trip CRUD + Places | 🚧 | `learning/08-trip-crud.md` (itinerary API còn lại) |
| scaffold | `apps/web` Next.js + map | ⬜ |

### Phase 2+ (chưa làm)

| Loại | Việc | TT |
|---|---|---|
| feature | JWT EdDSA + JWKS (thay / bổ sung session) | ⬜ |
| refactor | Tách microservices + gateway | ⬜ |
| feature | AI + RAG | ⬜ |

---

## Chi tiết gần đây (2026-07-15)

### Clone & chạy local
- Cài pnpm (Corepack), copy `.env`, `docker compose up`, `pnpm install`, migrate, seed
- DBeaver: `localhost:5433` / `tripmind` / `tripmind`
- Seed không chạy tự động sau migrate có sẵn → cần `pnpm --filter @tripmind/api prisma:seed`

### Task #5 — Auth
- Endpoint: `POST /auth/register|login|logout`, `GET /auth/me`
- Password: argon2id; session Redis; lỗi RFC 9457 problem+json
- Demo user: `demo@tripmind.local` / `password123`
- **Chưa** JWT (đúng roadmap Phase 1)

### Refactor cấu trúc auth
```
auth/
  auth.{controller,service,module}.ts
  guards/       local-auth, session-auth
  strategies/   local
  serializers/  session
  utils/        password
```

### Task #6 — Tests Auth ✅
- Unit: password util, Zod pipe, LocalStrategy (stub)
- Integration: Testcontainers Postgres + Redis, supertest agent
- Lệnh: `pnpm --filter @tripmind/api test` · `pnpm --filter @tripmind/api test:integration`

### Response format thống nhất ✅
- Success: `{ data: ... }` (`TransformInterceptor`)
- Error: problem+json + `category: business | system` (filter + Logger cho system)
- Plan: `docs/learning/07-response-format.md`

### Auth session flow (học)
- Sơ đồ Mermaid Login → Me → Logout + layer map: `docs/learning/09-auth-session-flow.md`

### Trip CRUD + Places (Phần A+B) ✅
- Bài giảng: `docs/learning/08-trip-crud.md`
- Models: Trip, Place, ItineraryItem (schema); API itinerary = Phần C chưa làm
- Endpoints: `/trips` CRUD + `/trips/:id/places` CRUD; ownership qua session
- Seed: trip Đà Lạt + 2 places cho demo user

---

## Lệnh hay dùng

```bash
docker compose -f infra/docker-compose.yml up -d
pnpm install
pnpm --filter @tripmind/api prisma:migrate
pnpm --filter @tripmind/api prisma:seed
pnpm dev

pnpm --filter @tripmind/api test
pnpm --filter @tripmind/api test:integration   # sau khi Task #6 xong
```

---

*Cập nhật file này khi xong một mốc mới (1–3 dòng/mốc là đủ).*
