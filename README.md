# TripMind

AI-powered trip planner — xem `docs/01-requirements.md`, `docs/02-architecture.md`, `docs/03-roadmap.md` để hiểu bối cảnh đầy đủ.

## Bắt đầu

```bash
pnpm install
docker compose -f infra/docker-compose.yml up -d   # postgres + redis
cp .env.example .env
pnpm dev
```

Health check: `GET http://localhost:3000/health`

## Scripts

```bash
pnpm lint
pnpm typecheck
pnpm test
```

## Trạng thái

Đang ở **Phase 1** (modular monolith, `apps/api`) theo `docs/03-roadmap.md`. Xem `CLAUDE.md` cho conventions.
