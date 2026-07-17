# `@tripmind/web`

Next.js App Router (Phase 1 UI). Browser gọi `/api/*` → rewrite sang Nest.

## Chạy

```bash
# từ root monorepo
docker compose -f infra/docker-compose.yml up -d
pnpm --filter @tripmind/api prisma:seed
pnpm dev
```

- Web: http://localhost:3001
- API (trực tiếp): http://localhost:3000/health
- Qua proxy: http://localhost:3001/api/health

Copy `apps/web/.env.example` → `apps/web/.env.local` nếu cần đổi URL.

## Phase 1 UI

- Auth: `/vi/login`, `/en/login` — session cookie qua `/api/*` rewrite
- Trips CRUD, places + MapLibre, itinerary + dnd-kit reorder
- **next-intl**: `messages/{vi,en}.json`

Demo: `demo@tripmind.local` / `password123`

## Cấu trúc

```
messages/        # vi.json, en.json
src/
  app/[locale]/(auth)/
  app/[locale]/(app)/
  i18n/          # routing, request, navigation
  features/auth/
  lib/
  providers/
  middleware.ts  # next-intl + gate cookie
```
