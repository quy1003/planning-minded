# TripMind — Database Schema Design (trip_db, catalog_db & ai_db)

> Trọng tâm: places có lat/lng, thứ tự ghé thăm, schedule. Prisma schema, dùng được trực tiếp.

## Nguyên tắc thiết kế

1. **Tách `Place` khỏi `ItineraryItem`**: một địa điểm (chợ Đà Lạt) có thể xuất hiện 2 lần trong trip (sáng đi chợ, tối quay lại chợ đêm) → Place lưu 1 lần, ItineraryItem tham chiếu.
2. **Trip snapshot places** (copy từ catalog lúc lưu) thay vì chỉ tham chiếu `catalog_place_id`: nếu admin sửa/xóa POI trong catalog, trip cũ của user không bị hỏng. Vẫn giữ `catalogPlaceId` để trace nguồn. Đây cũng là nguyên tắc microservices: trip-service không phụ thuộc runtime vào catalog-service khi đọc trip.
3. **Thứ tự 3 tầng**: `dayNumber` (ngày thứ mấy) → `slot` (sáng/chiều/tối) → `visitOrder` (thứ tự trong slot). Unique constraint chống trùng thứ tự.
4. **Schedule mềm**: `startTime`/`endTime` là `TIME` optional — plan AI sinh ra có giờ gợi ý, user chỉnh được; validation chồng lấn làm ở application layer (cảnh báo, không chặn cứng).
5. Tọa độ WGS84: `Decimal(9,6)` (~0.1m độ chính xác, đủ cho mọi POI). Không cần PostGIS ở v1 — chỉ hiển thị marker, chưa query không gian. Khi cần "tìm POI trong bán kính X km" thì thêm PostGIS (ADR mới).
6. **Index ngoài PK/FK mặc định của Prisma**: GIN cho `tags[]`, HNSW cho `embedding`, trigram/tsvector cho search `?q=` — chi tiết lý do từng loại xem [`07-faq.md`](07-faq.md#trip--database).

## Prisma schema — trip-service (trip_db)

```prisma
// apps/trip-service/prisma/schema.prisma

enum TripStatus {
  DRAFT
  PLANNED
  COMPLETED
}

enum DaySlot {
  MORNING
  AFTERNOON
  EVENING
}

model Trip {
  id              String     @id @default(uuid())
  userId          String     // từ JWT sub — không FK vì user ở auth_db (database-per-service)
  title           String
  destinationName String     // "Đà Lạt"
  startDate       DateTime?  @db.Date
  days            Int        // số ngày
  partySize       Int
  budget          Decimal    @db.Decimal(12, 2)
  currency        String     @default("VND") @db.Char(3)
  status          TripStatus @default(DRAFT)
  aiSessionId     String?    // trace về plan session đã sinh ra trip này
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt

  places          Place[]
  itineraryItems  ItineraryItem[]

  @@index([userId, status])
  @@map("trips")
}

model Place {
  id             String   @id @default(uuid())
  tripId         String
  trip           Trip     @relation(fields: [tripId], references: [id], onDelete: Cascade)
  name           String   // "Hồ Xuân Hương"
  address        String?
  lat            Decimal  @db.Decimal(9, 6)   // -90..90, validate ở DTO
  lng            Decimal  @db.Decimal(9, 6)   // -180..180
  catalogPlaceId String?  // trace nguồn catalog; null nếu user tự thêm
  createdAt      DateTime @default(now())

  itineraryItems ItineraryItem[]

  @@index([tripId])
  @@map("places")
}

model ItineraryItem {
  id          String   @id @default(uuid())
  tripId      String
  trip        Trip     @relation(fields: [tripId], references: [id], onDelete: Cascade)
  placeId     String
  place       Place    @relation(fields: [placeId], references: [id], onDelete: Restrict)

  // Thứ tự 3 tầng
  dayNumber   Int      // 1-based, <= trip.days
  slot        DaySlot
  visitOrder  Int      // 1-based trong slot

  // Schedule
  startTime   DateTime? @db.Time  // giờ trong ngày, vd 08:30
  endTime     DateTime? @db.Time
  durationMin Int?                // dùng khi chưa chốt giờ cụ thể

  title       String              // "Ăn sáng bánh căn"
  description String?
  estCost     Decimal  @default(0) @db.Decimal(12, 2)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([tripId, dayNumber, slot, visitOrder])  // chống trùng thứ tự
  @@index([tripId, dayNumber])
  @@map("itinerary_items")
}
```

## Prisma schema — catalog-service (catalog_db)

```prisma
// apps/catalog-service/prisma/schema.prisma

model Destination {
  id          String   @id @default(uuid())
  name        String   @unique          // "Đà Lạt"
  region      String                    // "Tây Nguyên"
  description String
  lat         Decimal  @db.Decimal(9, 6) // tâm điểm đến, để center map
  lng         Decimal  @db.Decimal(9, 6)
  bestSeasons String[]                  // ["11-03"]
  tags        String[]                  // ["núi", "lãng mạn", "mát mẻ"]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  pois        Poi[]

  @@index([region])
  @@index([tags], type: Gin)   // cho query D3: ?tags= — cần Prisma preview feature "postgresqlExtensions" (extension pg_trgm/gin)
  @@map("destinations")
}

model Poi {
  id             String   @id @default(uuid())
  destinationId  String
  destination    Destination @relation(fields: [destinationId], references: [id], onDelete: Cascade)
  name           String       // "Chợ đêm Đà Lạt"
  address        String?
  lat            Decimal  @db.Decimal(9, 6)  // NGUỒN SỰ THẬT tọa độ toàn hệ thống
  lng            Decimal  @db.Decimal(9, 6)
  category       String       // food | sightseeing | activity | accommodation | transport
  description    String
  estCostMin     Decimal  @db.Decimal(12, 2)
  estCostMax     Decimal  @db.Decimal(12, 2)
  avgDurationMin Int
  openingHours   Json?        // {"mon":[["08:00","22:00"]],...}
  tags           String[]
  kidFriendly    Boolean  @default(false)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@unique([destinationId, name])
  @@index([destinationId, category])
  @@index([tags], type: Gin)
  @@map("pois")
}
```

## Prisma schema — ai-service (ai_db)

> Cột `vector` + index hnsw/gin/tsvector không có type native trong Prisma, phải xử lý đặc biệt — xem [`07-faq.md`](07-faq.md#trip--database) mục "Vì sao Prisma không khai báo được vector/HNSW/GIN/tsvector trực tiếp?".

```prisma
// apps/ai-service/prisma/schema.prisma

model Document {
  id         String   @id @default(uuid())
  sourceType String   // "destination" | "poi"
  sourceId   String   // id bên catalog_db (không FK — khác database)
  content    String
  metadata   Json?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  chunks     Chunk[]

  @@index([sourceType, sourceId])   // tìm lại doc khi consume event destination.upserted để re-index
  @@map("documents")
}

model Chunk {
  id         String                  @id @default(uuid())
  documentId String
  document   Document                @relation(fields: [documentId], references: [id], onDelete: Cascade)
  content    String
  embedding  Unsupported("vector(1024)")  // bge-m3, 1024 dim — xem infra/migrations cho index HNSW
  metadata   Json?                   // { placeId, lat, lng, estCost } — grounded places
  createdAt  DateTime                @default(now())

  @@index([documentId])
  @@map("chunks")
  // Thêm bằng raw SQL trong migration (Prisma không khai báo được):
  //   CREATE INDEX chunks_embedding_hnsw_idx ON chunks USING hnsw (embedding vector_cosine_ops);
  //   CREATE INDEX chunks_metadata_gin_idx ON chunks USING gin (metadata jsonb_path_ops);
  //   CREATE INDEX chunks_content_tsv_idx ON chunks USING gin (to_tsvector('simple', content));
}

model PlanSession {
  id          String   @id @default(uuid())
  userId      String   // từ JWT sub — không FK, user ở auth_db
  aiSessionId String   @unique   // trip-service trace qua field này khi lưu trip
  messages    Json     // lịch sử hội thoại refine (conversational refinement)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([userId])
  @@map("plan_sessions")
}
```

Ghi chú vận hành: `PlanSession` chỉ ghi khi lưu plan thành trip (chi tiết Redis-vs-Postgres xem FAQ); cần bật extension `CREATE EXTENSION IF NOT EXISTS vector;` trước khi migrate `ai_db`.

## Zod schema (packages/shared) — contract AI output & API

```ts
// packages/shared/src/schemas/trip-plan.schema.ts
import { z } from "zod";

export const latLngSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const planActivitySchema = z.object({
  placeId: z.string().uuid(),         // BẮT BUỘC từ catalog — LLM không được bịa
  placeName: z.string(),
  ...latLngSchema.shape,              // ai-service join từ catalog, không lấy từ LLM
  slot: z.enum(["MORNING", "AFTERNOON", "EVENING"]),
  visitOrder: z.number().int().positive(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  title: z.string(),
  description: z.string(),
  estCost: z.number().nonnegative(),
});

export const planDaySchema = z.object({
  dayNumber: z.number().int().positive(),
  theme: z.string(),                  // "Ngày 1: Khám phá trung tâm"
  activities: z.array(planActivitySchema).min(1),
});

export const tripPlanSchema = z.object({
  destinationName: z.string(),
  center: latLngSchema,               // để FE center bản đồ
  days: z.array(planDaySchema).min(1),
  totalEstCost: z.number().nonnegative(),
  currency: z.literal("VND"),
  citations: z.array(z.object({ chunkId: z.string(), source: z.string() })),
  warnings: z.array(z.string()),      // vd "vượt budget 8%, đã cắt hoạt động X"
});
export type TripPlan = z.infer<typeof tripPlanSchema>;
```

## API responses liên quan bản đồ

```jsonc
// GET /api/v1/trips/:id/itinerary
{
  "tripId": "…",
  "center": { "lat": 11.940419, "lng": 108.458313 },
  "days": [
    {
      "dayNumber": 1,
      "items": [
        {
          "id": "…", "visitOrder": 1, "slot": "MORNING",
          "startTime": "08:30", "endTime": "10:00",
          "title": "Dạo Hồ Xuân Hương",
          "place": { "id": "…", "name": "Hồ Xuân Hương",
                     "lat": 11.942700, "lng": 108.444160 },
          "estCost": 0
        }
      ]
    }
  ]
}
```

Reorder atomic:
```jsonc
// PATCH /api/v1/trips/:id/itinerary/reorder  — chạy trong 1 transaction
{ "moves": [
    { "itemId": "a", "dayNumber": 1, "slot": "AFTERNOON", "visitOrder": 1 },
    { "itemId": "b", "dayNumber": 1, "slot": "AFTERNOON", "visitOrder": 2 }
] }
```
**Quyết định:** trong transaction, set `visitOrder` tạm thành số âm cho các items bị ảnh hưởng, rồi set giá trị cuối (tránh vi phạm unique constraint giữa chừng). Không dùng `DEFERRABLE INITIALLY DEFERRED` — cách âm tạm đơn giản hơn, không cần raw SQL migration ngoài Prisma.

## Frontend map (MapLibre) — dữ liệu cần
Mỗi ngày một màu polyline; markers đánh số `visitOrder` liên tục trong ngày (sáng→chiều→tối); `center` + `bounds` tính từ min/max lat/lng của places. GeoJSON build từ response itinerary ở client.
```

## Checklist validation (application layer)
- lat/lng trong range; place phải thuộc cùng trip với itinerary item.
- `dayNumber <= trip.days`; endTime > startTime; cảnh báo nếu 2 items cùng ngày chồng giờ.
- Tổng `estCost` các items ≤ budget → không thì trả `warnings`.
- Xóa Place đang được ItineraryItem dùng → chặn (onDelete: Restrict).
```
