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

## Cấu trúc (Slice 0)

```
src/
  app/           # routes
  components/    # UI dùng chung
  lib/           # api-client, env
  features/      # auth, trips… (slice sau)
```
