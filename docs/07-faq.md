# TripMind — FAQ (Q&A các quyết định & khái niệm)

> File này gom lại **"vì sao"** đằng sau các quyết định trong `02-architecture.md` / `06-database-schema.md` — để các file kia giữ gọn (chỉ mô tả cấu trúc), còn lý do/trade-off tra ở đây khi cần. Thêm mục mới mỗi khi có quyết định đáng nhớ trong lúc làm việc với Claude Code.

## Kiến trúc tổng thể

**Q: Vì sao chọn microservices cho một app quy mô nhỏ, 1 người làm?**
Đây là **over-engineering có chủ đích** — mục tiêu của repo là học, không phải tối ưu chi phí vận hành production. Một team 1 người làm sản phẩm thật nên bắt đầu bằng modular monolith. Xem `03-roadmap.md` Phase 1.

**Q: Vì sao Phase 1 làm modular monolith rồi mới tách microservices ở Phase 3?**
Học tách service tốt nhất bằng cách *tách* một monolith có ranh giới module rõ ràng sẵn — sẽ hiểu **tại sao** cần tách (coupling ở đâu, contract nào phải cứng hóa), thay vì tách theo trend rồi không biết trade-off thật sự nằm ở đâu.

**Q: Vì sao auth-service được tách riêng ở Phase 2, trước cả Phase 3 (tách các service còn lại)?**
Vì auth-service dùng JWT bất đối xứng + JWKS: service khác verify token bằng public key, **không cần gọi ngược lại** auth-service — đây là service dễ tách nhất về mặt kỹ thuật (loose coupling tự nhiên), phù hợp làm bài học tách service đầu tiên trước khi đụng tới gRPC/RabbitMQ ở Phase 3.

## Auth & Security

**Q: JWKS là gì, sao không dùng HS256 cho đơn giản?**
HS256 dùng 1 secret key đối xứng — mọi service verify token đều phải biết secret đó (tăng bề mặt lộ key). RS256/EdDSA là bất đối xứng: auth-service giữ private key để ký, các service khác chỉ cần **public key** (lấy qua `GET /.well-known/jwks.json`) để verify — không cần gọi auth-service mỗi request, và lộ public key không sao vì không ký được token giả.

**Q: Vì sao chọn EdDSA thay vì RS256?**
EdDSA (Ed25519) hiện đại hơn, key ngắn hơn, ký/verify nhanh hơn RS256 với cùng mức an toàn. RS256 vẫn phổ biến hơn nên hỗ trợ tương thích tốt hơn nếu cần tích hợp hệ thống cũ — doc chấp nhận cả 2, ADR sẽ chốt khi thực làm Phase 2.

## Trip & Database

**Q: Vì sao trip snapshot places (copy dữ liệu) thay vì chỉ tham chiếu `catalogPlaceId`?**
Nếu chỉ FK sang catalog, khi admin sửa/xóa POI thì trip cũ của user bị vỡ hoặc đổi ngầm dữ liệu lịch sử. Snapshot giữ trip ổn định theo thời gian; vẫn giữ `catalogPlaceId` để trace nguồn. Đây cũng đúng tinh thần microservices: trip-service không phụ thuộc runtime vào catalog-service khi đọc trip.

**Q: Vì sao dùng số âm tạm thời khi reorder itinerary thay vì `DEFERRABLE` constraint?**
Cả hai đều tránh vi phạm `UNIQUE(tripId, dayNumber, slot, visitOrder)` giữa chừng transaction. Số âm tạm đơn giản hơn — chỉ cần 2 bước UPDATE trong Prisma transaction, không cần raw SQL migration đặc biệt. `DEFERRABLE INITIALLY DEFERRED` "đẹp" hơn về mặt Postgres nhưng Prisma không khai báo được trực tiếp trong schema, phải tự viết migration tay — chọn hướng đơn giản trước, có thể đổi sau nếu cần.

**Q: Vì sao cần GIN index cho các cột `tags String[]`?**
B-tree (index mặc định) chỉ tối ưu cho so sánh bằng/khoảng (`=`, `<`, `>`). Với mảng, query dạng "chứa phần tử X" (`tags @> ARRAY['biển']`) cần GIN index mới dùng được index — không có GIN thì Postgres phải quét toàn bảng mỗi lần lọc theo tag.

**Q: Vì sao `chunks.embedding` bắt buộc phải có HNSW index?**
pgvector không tự tạo index cho phép toán similarity (cosine/L2 distance). Không có HNSW (hoặc ivfflat), mọi truy vấn "tìm chunk gần nhất" là **sequential scan toàn bảng** — đây là bước lõi của RAG nên chậm là chặn cả pipeline. HNSW cho phép tìm gần-đúng-nhanh (approximate nearest neighbor), đánh đổi 1 chút độ chính xác lấy tốc độ.

**Q: Vì sao Prisma không khai báo được vector/HNSW/GIN/tsvector trực tiếp?**
Đây là các kiểu dữ liệu/index đặc thù của Postgres (qua extension `pgvector`, `pg_trgm`) mà Prisma chưa hỗ trợ native. Cách xử lý: khai báo cột bằng `Unsupported("vector(1024)")`, còn các index thì viết raw SQL trong file migration (`prisma migrate dev` tạo file trống rồi tự thêm `CREATE INDEX ... USING hnsw/gin`). Prisma Client cũng không tự dùng được các index này cho query — phải gọi `$queryRaw`.

## AI / RAG

**Q: Vì sao chọn Ollama (local) + bge-m3 thay vì Claude API + Voyage AI?**
Quyết định đổi sang **free/local** để không tốn chi phí API khi học và thử nghiệm nhiều. Đánh đổi: chậm hơn, cần máy đủ RAM/VRAM, và structured output/tool-use qua model open-source có thể kém ổn định hơn Claude — nên cần validate (zod) chặt để bắt lỗi format, và có thể cần retry/self-correction nhiều hơn 2 lần như dự kiến ban đầu.

**Q: Vì sao chọn bge-m3 cho embedding?**
Hỗ trợ đa ngôn ngữ tốt (bao gồm tiếng Việt) — phù hợp nội dung catalog địa điểm Việt Nam. Output 1024 chiều khớp sẵn với `vector(1024)` đã khai báo trong schema, không cần đổi kích thước cột.

**Q: Vì sao `plan_sessions` lưu cả Redis lẫn Postgres?**
Trong lúc user đang hội thoại refine plan (chưa lưu trip), state chỉ là nháp — Redis với TTL ngắn là đủ, tránh ghi Postgres liên tục mỗi lượt chat. Khi user **lưu plan thành trip**, ghi lại 1 bản vào Postgres (`ai_db.plan_sessions`, unique `aiSessionId`) để trip-service trace ngược được plan nào sinh ra trip nào, và giữ lịch sử hội thoại lâu dài nếu cần debug/audit prompt sau này.

**Q: Vì sao LLM không được tự sinh tọa độ (lat/lng)?**
Chống hallucination tọa độ — LLM chỉ được chọn `placeId` từ danh sách candidate places (lấy từ catalog qua RAG) đưa vào context; sau khi LLM trả lời, ai-service **join lại catalog** để lấy lat/lng chính xác, không tin tưởng số LLM tự viết ra.

---
*Cách dùng: khi Claude Code hoặc bạn ra một quyết định kiến trúc mới đáng nhớ, thêm 1 mục Q&A vào đây (ngắn gọn: quyết định + vì sao). Quyết định lớn, ảnh hưởng dài hạn thì vẫn nên có ADR riêng trong `docs/adr/` theo `02-architecture.md` mục 8 — FAQ này là bản ghi nhanh, ADR là bản ghi trang trọng có context/decision/consequences.*
