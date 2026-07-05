# TripMind — Architecture Document

> Phiên bản 1.0 · Đọc kèm `01-requirements.md`

## 1. Tech Stack

| Layer | Công nghệ | Lý do chọn (góc độ học tập) |
|---|---|---|
| Frontend | **Next.js 15** (App Router, RSC, Server Actions), TypeScript, TailwindCSS, shadcn/ui, TanStack Query, Zustand | Chuẩn hiện đại nhất của React ecosystem |
| Maps | **MapLibre GL JS** + tiles OpenFreeMap/OSM (miễn phí, không cần API key); dnd-kit cho kéo-thả reorder | Open-source thay Mapbox; markers đánh số + polyline lộ trình theo ngày |
| Geo data | Tọa độ WGS84 lưu `numeric(9,6)`; catalog là nguồn sự thật về lat/lng; geocoding bổ sung qua Nominatim (OSM) khi admin nhập liệu | AI không được bịa tọa độ — chỉ lấy từ catalog/RAG |
| Backend services | **NestJS 11** (Node 22 LTS), TypeScript strict | DI, modular architecture, chuẩn enterprise |
| API Gateway | NestJS gateway (REST + BFF) | Tự viết để hiểu pattern; sau này có thể thay Kong/Traefik |
| Giao tiếp liên service | Sync: HTTP/**gRPC** (NestJS microservice transport) · Async: **RabbitMQ** (events) | Học cả 2 mô hình sync/async |
| Database | **PostgreSQL 17** — mỗi service 1 database riêng (database-per-service) | Chuẩn microservices |
| ORM | **Prisma** (hoặc Drizzle) | Type-safe, migration tốt |
| Vector DB (RAG) | **pgvector** (extension của Postgres) | Ít vận hành nhất khi học; nâng cấp Qdrant sau nếu muốn |
| LLM | **Ollama** (local, self-hosted) chạy model open-source — Qwen2.5 hoặc Llama 3.1 (hỗ trợ tiếng Việt khá tốt) qua **ai-service** riêng | Miễn phí, chạy local, học được cách tự host LLM; đánh đổi: chậm hơn API trả phí, cần máy đủ RAM/VRAM |
| Embeddings | **BAAI/bge-m3** (open-source, 1024 dim) qua Ollama hoặc sentence-transformers, chạy local | Miễn phí, hỗ trợ đa ngôn ngữ (tốt cho nội dung tiếng Việt), dim khớp sẵn với `vector(1024)` trong schema |
| Cache | **Redis** (session revocation list, rate limit, cache) | |
| Auth | JWT **RS256/EdDSA** (asymmetric), JWKS, argon2, refresh rotation | Yêu cầu của bạn |
| Infra local | **Docker Compose** (profiles) | 1 lệnh chạy tất cả |
| CI/CD | **GitHub Actions** | lint → test → build → docker |
| Observability | OpenTelemetry + Jaeger (tracing), pino (logs), Prometheus + Grafana (metrics) | |
| Monorepo | **pnpm workspaces + Turborepo** | Chuẩn hiện đại, cache builds |
| Testing | Vitest/Jest (unit), Supertest + Testcontainers (integration), Playwright (e2e) | |

## 2. Sơ đồ hệ thống

```
                        ┌─────────────────┐
   Browser ──────────▶  │  Next.js (web)  │
                        └────────┬────────┘
                                 │ HTTPS (REST/SSE)
                        ┌────────▼────────┐
                        │   api-gateway   │  ← verify JWT bằng public key (JWKS)
                        └──┬───┬───┬───┬──┘
              gRPC/HTTP    │   │   │   │
        ┌──────────────┐   │   │   │   │   ┌──────────────┐
        │ auth-service │◀──┘   │   │   └──▶│  ai-service  │──▶ Ollama (local)
        │  (Postgres,  │       │   │       │ (RAG:pgvector│
        │   Redis)     │       │   │       │  + Ollama)   │
        └──────┬───────┘       │   │       └──────▲───────┘
               │        ┌──────▼─┐ └──────────┐   │ đọc knowledge
               │        │ trip-  │   ┌────────▼─┐ │
               │        │ service│   │ catalog- │─┘
               │        │ (PG)   │   │ service  │
               │        └───┬────┘   │ (PG)     │
               │            │        └────┬─────┘
               │            │             │ event: destination.updated
               ▼            ▼             ▼
        ┌─────────────────────────────────────────┐
        │              RabbitMQ (events)          │──▶ notification-service (email)
        └─────────────────────────────────────────┘         (phase sau)
```

## 3. Services

### 3.1 api-gateway
BFF cho web. Route requests, verify JWT (public key từ JWKS của auth-service, cache lại), rate limiting, request validation, aggregate responses. Không chứa business logic.

### 3.2 auth-service
- Đăng ký/đăng nhập, profile.
- **Asymmetric crypto:** ký JWT bằng private key (RS256 hoặc EdDSA/Ed25519 — hiện đại hơn); expose `GET /.well-known/jwks.json` chứa public key. Các service khác verify token mà **không cần gọi** auth-service → loose coupling, đây chính là lợi ích của bất đối xứng so với HS256.
- Refresh token: opaque, lưu hash trong DB, rotation mỗi lần dùng, revocation list trong Redis.
- Key rotation: hỗ trợ nhiều key qua `kid` trong JWKS.
- Password: argon2id.

### 3.3 trip-service
CRUD trips + places + itinerary items. **Trip thủ công là flow chính** — trip-service hoạt động độc lập hoàn toàn với ai-service (AI down thì user vẫn lên plan bình thường). Trip từ AI chỉ khác ở chỗ payload tạo trip được điền sẵn từ plan (trace bằng `aiSessionId`, null với trip thủ công). Owner-based authorization (userId từ JWT claims). Publish events `trip.created`, `trip.upcoming`.

### 3.4 catalog-service
Quản lý destinations, activities, chi phí tham khảo (admin CRUD + public read). Khi dữ liệu thay đổi → publish `destination.upserted` → ai-service consume và re-index embeddings. Đây là bài học **event-driven architecture**.

### 3.5 ai-service (trọng tâm RAG)
```
Ingestion:  destination docs ──chunk (theo section, ~500 tokens)──▶ embed (bge-m3, local)──▶ pgvector
Query:      user request ──▶ build search queries ──▶ hybrid search
            (vector similarity + keyword) ──▶ top-k chunks ──▶ rerank (optional)
            ──▶ prompt = system + context + user constraints
            ──▶ LLM structured output qua Ollama (Qwen2.5/Llama 3.1, local) — JSON schema: TripPlan ──▶ validate (zod)
            ──▶ stream SSE về client + citations (chunk ids → nguồn)
```
- **Local-first, miễn phí:** LLM và embedding chạy qua **Ollama** (self-hosted) — lý do chọn + đánh đổi xem [`07-faq.md`](07-faq.md#ai--rag).
- **Grounded places:** chunks trong vector DB mang metadata `{placeId, lat, lng, estCost}`. LLM chỉ được chọn hoạt động từ danh sách candidate places đưa vào context (kèm placeId); output schema bắt buộc `placeId` cho mỗi hoạt động → service join lại catalog để lấy lat/lng chính xác. LLM không bao giờ tự sinh tọa độ.
- Budget guardrail: sau khi LLM sinh plan, service tự cộng chi phí và so với budget; vượt thì yêu cầu LLM revise (self-correction loop, tối đa 2 lần).
- Conversational refinement: lưu conversation state theo `planSessionId` — cache ở Redis (TTL) trong lúc đang refine; khi user lưu plan thành trip thì ghi lại vào Postgres (`ai_db.plan_sessions`, trace qua `aiSessionId`).
- Đánh giá RAG: bộ golden questions + eval script (học về LLM evals).

### 3.6 notification-service (phase 4)
Consume events từ RabbitMQ, gửi email (Resend/SES). Học pattern consumer, retry, dead-letter queue.

## 4. Data Model (rút gọn)

```
auth_db:    users(id, email, password_hash, name, avatar_url, preferences jsonb, created_at)
            refresh_tokens(id, user_id, token_hash, expires_at, rotated_from, revoked_at)
                  INDEX(user_id), UNIQUE(token_hash)   -- lookup nhanh khi verify/rotate refresh token
            signing_keys(kid, private_pem encrypted, public_pem, alg, active, created_at)

trip_db:    trips(id, user_id, title, destination_name, start_date, days, party_size,
                  budget, currency, status, created_at, updated_at)
            places(id, trip_id, name, address, lat numeric(9,6), lng numeric(9,6),
                  catalog_place_id?, created_at)          -- snapshot địa điểm trong trip
            itinerary_items(id, trip_id, place_id → places, day_number,
                  slot[morning|afternoon|evening], visit_order,
                  start_time?, end_time?, duration_min?,
                  title, description, est_cost, created_at)
                  UNIQUE(trip_id, day_number, slot, visit_order)

catalog_db: destinations(id, name, region, description, lat, lng, best_seasons, tags[], ...)
            places(id, destination_id, name, address, lat numeric(9,6), lng numeric(9,6),
                  category, description, est_cost_range, avg_duration_min,
                  opening_hours jsonb?, tags[], kid_friendly)   -- POIs, nguồn sự thật tọa độ

ai_db:      documents(id, source_type, source_id, content, metadata jsonb)
                  INDEX(source_type, source_id)  -- tìm lại doc cũ khi consume event destination.upserted để re-index
            chunks(id, document_id, content, embedding vector(1024), metadata jsonb)
                  INDEX(document_id)                                   -- join ngược + xóa hết chunk khi re-index 1 document
                  INDEX USING hnsw(embedding vector_cosine_ops)         -- BẮT BUỘC, không thì similarity search full scan
                  INDEX USING gin(metadata jsonb_path_ops)              -- lọc theo placeId khi build candidate list (grounded places)
                  INDEX USING gin(to_tsvector('simple', content))       -- phần "keyword" của hybrid search
            plan_sessions(id, user_id, ai_session_id, messages jsonb, created_at)
                  INDEX(user_id), UNIQUE(ai_session_id)  -- tra cứu khi refine tiếp / trip-service trace ngược qua aiSessionId
                  -- cache nháp ở Redis (TTL) trong lúc refine; ghi record này khi user lưu plan thành trip
```

## 5. API Design (đại diện)

```
POST /api/v1/auth/register | /login | /refresh | /logout
GET  /.well-known/jwks.json                 (auth-service)
GET  /api/v1/me

POST /api/v1/plans                          body: {destination?, budget, partySize, days, startDate?, interests[], style}
                                            → 202 + planSessionId, stream qua:
GET  /api/v1/plans/:sessionId/stream        (SSE)
POST /api/v1/plans/:sessionId/refine        body: {message}

POST /api/v1/trips                          (lưu plan thành trip, kèm places + itinerary)
GET  /api/v1/trips | GET/PATCH/DELETE /api/v1/trips/:id
GET  /api/v1/trips/:id/itinerary            (grouped theo day → slot → visit_order, kèm lat/lng)
PATCH /api/v1/trips/:id/itinerary/reorder   body: [{itemId, dayNumber, slot, visitOrder}] — atomic
PATCH /api/v1/trips/:id/itinerary/:itemId   (sửa schedule: start_time, end_time, ...)

GET  /api/v1/destinations?tags=&region=&q=
POST /api/v1/admin/destinations             (role: admin)
```
Quy ước: versioned `/v1`, error format chuẩn RFC 9457 (problem+json), pagination cursor-based, validation bằng zod/class-validator, OpenAPI tự sinh từ decorators.

## 6. Security Architecture
- Asymmetric JWT như 3.2; claims tối thiểu: `sub`, `email`, `role`, `iat`, `exp`, `kid` trong header.
- Gateway là entry duy nhất từ ngoài; services nội bộ trong Docker network riêng.
- Rate limit theo IP + user (Redis sliding window). Helmet, CORS whitelist, CSRF cho cookie flows.
- Secrets: `.env` local (không commit), GitHub Actions secrets cho CI. Bài học nâng cao: Docker secrets/Vault.
- Refresh token trong httpOnly Secure cookie; access token trong memory (không localStorage).

## 7. Monorepo Layout

```
tripmind/
├── apps/
│   ├── web/                  # Next.js
│   ├── api-gateway/
│   ├── auth-service/
│   ├── trip-service/
│   ├── catalog-service/
│   ├── ai-service/
│   └── notification-service/
├── packages/
│   ├── shared/               # DTOs, zod schemas, error types, event contracts
│   ├── config/               # eslint, tsconfig, prettier configs dùng chung
│   └── testing/              # test utils, fixtures
├── infra/
│   ├── docker-compose.yml    # postgres, redis, rabbitmq, jaeger, prometheus...
│   └── grafana/, prometheus/
├── docs/                     # 01-requirements.md, 02-architecture.md, adr/
├── turbo.json, pnpm-workspace.yaml, CLAUDE.md
```

## 8. Architecture Decision Records (ADRs)
Mỗi quyết định lớn ghi 1 file `docs/adr/NNN-title.md` (context → decision → consequences). Bắt đầu với: 001 monorepo+turborepo, 002 pgvector thay vì dedicated vector DB, 003 EdDSA cho JWT, 004 database-per-service, 005 RabbitMQ cho async events. Đây là thói quen senior engineer — hãy để Claude Code viết ADR mỗi khi cùng bạn ra quyết định.

## 9. Trade-offs thẳng thắn (vì đây là dự án học)
- Microservices cho app cỡ này là **over-engineering có chủ đích** — mục tiêu là học. Production thật với team 1 người nên bắt đầu modular monolith.
- pgvector đủ tốt đến hàng triệu vectors; chọn vì giảm số hệ thống phải vận hành.
- Tự viết gateway để hiểu; đừng kỳ vọng nó thay được Kong/Envoy.
