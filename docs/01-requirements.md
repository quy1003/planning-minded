# TripMind — Requirements Specification

> AI-powered Trip Planner. Phiên bản: 1.0 · Ngày: 2026-07-04 · Trạng thái: Draft
> Mục tiêu kép: sản phẩm hoạt động được + **dự án học tập** để nâng trình software engineering.

## 1. Tổng quan

**Vấn đề:** Lên kế hoạch du lịch tốn thời gian — phải tìm điểm đến, cân đối ngân sách, sắp lịch trình theo số người và sở thích.

**Giải pháp:** Người dùng **tự lên plan thủ công** (thêm địa điểm, sắp lịch trình, ước tính chi phí) — đây là flow cốt lõi. **AI là tính năng hỗ trợ tùy chọn**: nhập mong muốn (điểm đến, budget, số người, số ngày, sở thích, phong cách) → AI dùng RAG trên kho dữ liệu điểm đến để sinh lịch trình chi tiết theo ngày, kèm ước tính chi phí; user nhận plan rồi chỉnh tiếp thủ công như bình thường.

**Người dùng mục tiêu:** Du khách cá nhân/nhóm nhỏ, ưu tiên thị trường Việt Nam (đa ngôn ngữ vi/en).

## 2. Personas

| Persona | Mô tả | Nhu cầu chính |
|---|---|---|
| Linh, 24, sinh viên | Đi nhóm 4 người, budget chặt | Gợi ý điểm đến rẻ, chia chi phí rõ ràng |
| Minh, 30, nhân viên VP | Biết muốn đi đâu, không có thời gian lên lịch | Nhập "Đà Lạt, 3 ngày, 2 người, 5 triệu" → nhận plan ngay |
| Hoa, 35, gia đình | Đi cùng trẻ nhỏ | Lịch trình nhẹ nhàng, lọc theo phù-hợp-trẻ-em |

## 3. User Stories & Functional Requirements

### Epic A — Authentication & User (auth-service)
- **A1.** Là user, tôi đăng ký bằng email/password để lưu các trip của mình.
- **A2.** Là user, tôi đăng nhập và nhận access token (JWT ký bất đối xứng RS256/EdDSA) + refresh token.
- **A3.** Là user, tôi đăng nhập bằng Google OAuth (stretch goal).
- **A4.** Là user, tôi quản lý profile: tên, avatar, sở thích du lịch mặc định.
- **A5.** Là user, tôi đăng xuất; refresh token bị thu hồi (token rotation + revocation list).

**Acceptance chính:** password hash bằng argon2; access token TTL ≤ 15 phút; refresh token rotation; public key phân phối qua JWKS endpoint để các service khác tự verify.

### Epic B — AI Trip Planning (ai-service + RAG)
- **B1.** Là user, tôi nhập yêu cầu: điểm đến (tùy chọn), budget, số người, số ngày, ngày đi, sở thích (biển/núi/ẩm thực/văn hóa...), phong cách (tiết kiệm/thoải mái/sang trọng).
- **B2.** Nếu tôi chưa biết đi đâu, AI gợi ý 3–5 điểm đến phù hợp kèm lý do (dựa trên RAG).
- **B3.** AI sinh lịch trình chi tiết theo ngày: sáng/chiều/tối, mỗi hoạt động có mô tả, chi phí ước tính, địa điểm.
- **B4.** Tổng chi phí ước tính không vượt budget; nếu không khả thi, AI cảnh báo và đề xuất điều chỉnh.
- **B5.** Câu trả lời của AI phải trích nguồn từ knowledge base (citations) — chống hallucination.
- **B6.** Tôi có thể yêu cầu chỉnh sửa plan bằng hội thoại ("đổi ngày 2 sang hoạt động ngoài trời") — conversational refinement.
- **B7.** Response dạng streaming (SSE) để UX mượt.

**Acceptance chính:** RAG pipeline: ingest tài liệu điểm đến → chunk → embed → vector DB; câu trả lời có cấu trúc JSON hợp lệ (schema-validated); guardrail từ chối yêu cầu ngoài phạm vi du lịch.

### Epic C — Trip Management (trip-service)

> **Nguyên tắc:** trip thủ công và trip từ AI là **một loại trip duy nhất**, cùng data model, cùng API. AI chỉ là một cách "điền nhanh" nội dung ban đầu.

- **C0.** Là user, tôi **tạo trip thủ công từ đầu** (không cần AI): đặt tên, chọn điểm đến, ngày đi, số người, budget → thêm từng địa điểm (tìm từ catalog hoặc tự nhập tên + chọn vị trí trên bản đồ) → sắp vào ngày/slot/thứ tự → đặt giờ và chi phí ước tính cho từng hoạt động.
- **C1.** Là user, tôi lưu plan AI sinh ra thành trip (optional); sau đó chỉnh sửa tiếp thủ công y như trip tự tạo.
- **C2.** Là user, tôi xem danh sách trips, chi tiết trip, thêm/sửa/xóa từng hoạt động, xóa trip.
- **C3.** Là user, tôi đánh dấu trạng thái trip: draft / planned / completed.
- **C4.** Trip chứa **danh sách địa điểm (places)** — mỗi địa điểm có tên, địa chỉ, **kinh độ/vĩ độ (lat/lng)** để hiển thị trên bản đồ.
- **C5.** Các địa điểm trong trip có **thứ tự ghé thăm rõ ràng** (theo ngày → theo slot → theo order trong slot); tôi có thể kéo-thả sắp xếp lại.
- **C6.** Mỗi hoạt động có **schedule**: ngày thứ mấy, giờ bắt đầu/kết thúc dự kiến, thời lượng.
- **C7.** Là user, tôi chia sẻ trip qua public link read-only (stretch goal).

**Acceptance chính (C4–C6):** tọa độ chuẩn WGS84 (lat: -90..90, lng: -180..180); AI khi sinh plan phải trả về lat/lng cho từng địa điểm (lấy từ catalog qua RAG, không được bịa); reorder là atomic (không có 2 item trùng order trong cùng slot); thời gian các hoạt động trong một ngày không chồng lấn (validation cảnh báo).

### Epic D — Destination Catalog (catalog-service)
- **D1.** Hệ thống có kho dữ liệu điểm đến: mô tả, hoạt động, chi phí tham khảo, mùa đẹp, tags.
- **D2.** Là admin, tôi thêm/sửa dữ liệu điểm đến; dữ liệu mới tự động được index vào vector DB (event-driven).
- **D3.** Là user, tôi tìm kiếm/duyệt điểm đến theo tags, vùng miền.

### Epic E — Notification (notification-service, phase sau)
- **E1.** Email xác nhận đăng ký, email nhắc trước ngày khởi hành (event-driven qua message queue).

### Epic F — Frontend (NextJS)
- **F1.** Landing page + auth pages.
- **F2.** **Trip builder thủ công**: form tạo trip + màn hình soạn itinerary (tìm địa điểm từ catalog / tự nhập + ghim vị trí trên bản đồ, kéo-thả vào ngày/slot, đặt giờ, chi phí). Nút "Gợi ý bằng AI" là optional trong flow này.
- **F2b.** Wizard nhập yêu cầu AI trip (multi-step form) — lối tắt để AI điền nhanh itinerary.
- **F3.** Trang kết quả plan: timeline theo ngày, streaming khi AI đang sinh, nút lưu/chỉnh sửa.
- **F4.** Dashboard trips của tôi.
- **F5.** **Bản đồ tương tác** (MapLibre/Leaflet): hiển thị markers các địa điểm trong trip, đánh số theo thứ tự ghé thăm, nối polyline theo lộ trình từng ngày, click marker → chi tiết hoạt động; đồng bộ 2 chiều với timeline (hover item ↔ highlight marker).
- **F6.** Responsive, dark mode, i18n vi/en.

## 4. Non-Functional Requirements

| Loại | Yêu cầu |
|---|---|
| Security | RS256/EdDSA JWT, JWKS, argon2, rate limiting, helmet, input validation mọi endpoint, secrets qua env/vault, OWASP Top 10 |
| Performance | API p95 < 300ms (trừ AI); AI bắt đầu stream < 3s |
| Scalability | Services stateless, scale ngang độc lập |
| Reliability | Health checks, graceful shutdown, retry + circuit breaker khi gọi liên service |
| Observability | Structured logging (pino), distributed tracing (OpenTelemetry), metrics (Prometheus/Grafana) |
| Quality | TypeScript strict, ESLint + Prettier, unit coverage ≥ 80% cho business logic, integration + e2e tests, CI bắt buộc pass |
| DX | Monorepo, chạy toàn bộ stack bằng 1 lệnh (docker compose), seed data sẵn |
| Docs | OpenAPI/Swagger mỗi service, ADRs, README từng service |

## 5. Out of Scope (v1)
Đặt vé/khách sạn thực tế, thanh toán, mobile app, real-time collaboration, đa tenant.

## 6. Success Criteria
- Flow thủ công hoàn chỉnh: đăng ký → tạo trip → tự thêm địa điểm/lịch trình trên bản đồ → lưu → xem lại (không cần AI).
- Flow AI (optional): nhập yêu cầu → nhận plan AI có citations → lưu → chỉnh tiếp thủ công.
- Toàn bộ NFR mục 4 được thỏa mãn ở mức demo được.
- **Học được:** microservices patterns, RAG, asymmetric crypto auth, event-driven, observability, testing pyramid, CI/CD.
