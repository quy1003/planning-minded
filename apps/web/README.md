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

## Auth (Slice 1)

- `/login`, `/register` — Zod shared + React Hook Form
- `/trips` — placeholder (cần session); header có logout
- Cookie `tripmind.sid` qua rewrite `/api/*`

Demo: `demo@tripmind.local` / `password123`

## Cấu trúc

```
src/
  app/(auth)/    # login, register
  app/(app)/     # trips (đã login)
  features/auth/
  lib/           # api-client, query-keys
  providers/
  middleware.ts  # gate cookie nhẹ
```
