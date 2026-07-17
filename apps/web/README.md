# `@tripmind/web`

Next.js App Router (Phase 1 UI). Browser gọi `/api/*` → rewrite sang Nest (`localhost:3000`) để session cookie same-origin.

## Chạy

```bash
# từ root monorepo
docker compose -f infra/docker-compose.yml up -d
pnpm --filter @tripmind/api prisma:seed
pnpm dev
```

- Web: http://localhost:3001 (locale mặc định: `/vi/...`)
- API trực tiếp: http://localhost:3000/health
- Qua proxy: http://localhost:3001/api/health

Copy `apps/web/.env.example` → `apps/web/.env.local` nếu cần đổi URL.

Demo: `demo@tripmind.local` / `password123`

## Phase 1 UI

- Landing marketing: `/vi`, `/en` (features / how / pricing honest Phase 1)
- Dark / light: `next-themes` + CSS variables (`ThemeToggle`)
- Auth session cookie qua `/api/*`
- Trips CRUD, places + MapLibre, itinerary + dnd-kit reorder
- **next-intl**: `messages/{vi,en}.json`

## UX conventions (Slice 5)

Dùng shared UI trong `src/components/ui/` — **không** `window.confirm` / `alert` cho luồng chính:

| Component | Khi nào |
|-----------|---------|
| `Skeleton` / `*Skeleton` | Chờ list/detail |
| `QueryError` | Query fail + nút Retry (`refetch`) |
| `InlineAlert` | Lỗi/success ngắn trong form/section |
| `ConfirmDialog` | Mọi delete (trip / place / itinerary) |
| `SuccessDialog` | Báo lưu thành công (modal, không banner dưới form) |
| `ButtonPending` | Nút đang xử lý: **chỉ spinner** (ẩn chữ; sr-only giữ a11y) |
| `Spinner` | Pending mutation / session check |

Route: `app/[locale]/(app)/loading.tsx` + `error.tsx` cho segment app.

## Cấu trúc

```
messages/                 # vi.json, en.json
src/
  app/[locale]/
    layout.tsx            # html / fonts / providers (không header)
    (marketing)/          # public: header + footer landing → /vi, /en
    (auth)/               # login | register
    (app)/                # trips… + loading/error (cần session)
  components/             # BrandMark, ThemeToggle, ui/*
  features/{landing,auth,trips,places,itinerary}/
  i18n/
  lib/
  providers/
  middleware.ts
```

Chi tiết group: `docs/learning/18-route-groups-layouts.md`.
