# TripMind — Learning Roadmap

> Chia theo phase từ dễ → khó. Mỗi phase kết thúc bằng một thứ **chạy được** + bài học rút ra.
> Nguyên tắc: đừng nhảy phase. Mỗi phase ~1–3 tuần tùy thời gian của bạn.

## Phase 0 — Nền móng (setup)
**Làm:** monorepo pnpm + Turborepo, tsconfig/eslint/prettier dùng chung, docker-compose (postgres, redis), CI đầu tiên (lint + typecheck), CLAUDE.md, git repo + branch convention.
**Học:** monorepo tooling, CI cơ bản, conventional commits.
**Done khi:** `pnpm install && pnpm dev` chạy, CI xanh trên PR đầu tiên.

## Phase 1 — Modular monolith trước, microservices sau (khuyến nghị mạnh)
**Làm:** MỘT app NestJS chứa các module auth/trip/catalog (ranh giới rõ, giao tiếp qua interface) + Next.js web. CRUD trips hoàn chỉnh, chưa có AI.
**Học:** NestJS căn bản (modules, DI, pipes, guards, interceptors), Prisma, validation, error handling, Next.js App Router, gọi API, **MapLibre cơ bản**.
**Done khi:** đăng ký/đăng nhập tạm bằng session đơn giản, tạo/xem trip thủ công trên web; trip có places với lat/lng hiển thị markers trên bản đồ, itinerary có thứ tự + schedule, kéo-thả reorder hoạt động.
**Vì sao:** học microservices tốt nhất bằng cách *tách* một monolith có ranh giới sạch — bạn sẽ hiểu **tại sao** tách, không chỉ tách theo trend.

## Phase 2 — Auth chuẩn production (asymmetric crypto)
**Làm:** tách auth thành `auth-service` riêng đầu tiên. EdDSA/RS256 JWT, JWKS endpoint, argon2, refresh rotation + revocation (Redis), guards verify bằng public key ở app chính.
**Học:** mã hóa bất đối xứng thực chiến, JWT best practices, key rotation, OWASP auth.
**Done khi:** app chính verify token offline qua JWKS; test integration cho toàn bộ auth flows; revoke hoạt động.

## Phase 3 — Tách microservices + gateway
**Làm:** tách trip-service, catalog-service; thêm api-gateway; gRPC giữa services; RabbitMQ cho event `destination.upserted`; database-per-service; docker compose full stack.
**Học:** service boundaries, sync vs async, event contracts (packages/shared), distributed debugging, Testcontainers.
**Done khi:** toàn stack chạy bằng 1 lệnh; xóa 1 service khác vẫn degrade gracefully (circuit breaker).

## Phase 4 — AI + RAG (trọng tâm)
**Làm:** ai-service: ingestion pipeline (chunk → embed → pgvector), hybrid search, prompt + structured output (zod), SSE streaming, citations, budget self-correction loop, conversational refinement. Seed 15–20 destinations Việt Nam **kèm POIs có lat/lng thật**. LLM output ràng buộc `placeId` từ catalog (không bịa tọa độ). Trang wizard + kết quả streaming trên web + bản đồ đánh số thứ tự và polyline lộ trình theo ngày.
**Học:** RAG end-to-end, prompt engineering, LLM structured outputs, evals (bộ golden questions), streaming UX.
**Done khi:** nhập "Đà Lạt 3 ngày 2 người 5 triệu" → plan có citations, đúng budget, stream mượt.

## Phase 5 — Production-grade
**Làm:** OpenTelemetry tracing xuyên services (Jaeger), Prometheus + Grafana dashboard, structured logging correlation-id, health/readiness probes, graceful shutdown, e2e Playwright, coverage gate trong CI, security review, load test nhẹ (k6), notification-service + dead-letter queue.
**Học:** observability, resilience patterns, testing pyramid hoàn chỉnh.
**Done khi:** nhìn 1 request đi qua 4 services trên Jaeger; dashboard có RED metrics; e2e xanh trong CI.

## Phase 6 — Deploy (tùy chọn)
**Làm:** deploy lên VPS bằng docker compose + Caddy/Traefik (TLS), hoặc học Kubernetes (k3s) nếu muốn đi xa. Web lên Vercel.
**Học:** DNS, TLS, CD, secrets management thật.

## Cách làm việc mỗi task (lặp lại suốt dự án)
1. Chọn 1 task nhỏ từ phase hiện tại.
2. Vào Claude Code, **Plan mode** → duyệt plan → cho code.
3. Đọc code Claude viết, hỏi "giải thích X, tại sao không làm Y?" — đây là lúc học thật.
4. Chạy test, review diff, commit (conventional commits), PR, `/review`.
5. Cuối mỗi phase: yêu cầu Claude viết ADR + cập nhật docs, và tự viết 5 dòng "mình học được gì".
