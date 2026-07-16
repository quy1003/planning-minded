# Bài giảng — Phần C: Itinerary CRUD

> Trạng thái: **đã code** (2026-07-16). Tiếp theo của `08-trip-crud.md` (A+B).  
> Schema Prisma `ItineraryItem` đã có sẵn; bài này thêm Zod + API + seed + tests (kèm reorder).

---

## 1. Task làm gì? Vì sao cần?

**ItineraryItem** = “ngày X, buổi Y, thứ tự Z: thăm place P”.

- Place = điểm trên bản đồ (tên + lat/lng), lưu 1 lần trong trip.
- ItineraryItem = **lịch trình** trỏ tới Place (cùng chợ có thể ghé 2 lần → 2 item, 1 place).

Không có API itinerary thì user chỉ có “danh sách địa điểm”, chưa có “ngày 1 sáng đi đâu trước”.

---

## 2. Khái niệm mới (mức junior)

### `DaySlot` (enum)

Buổi trong ngày: `MORNING` | `AFTERNOON` | `EVENING`.

### Unique constraint

```
@@unique([tripId, dayNumber, slot, visitOrder])
```

Trong **cùng trip + cùng ngày + cùng buổi**, `visitOrder` không trùng.  
Tạo/sửa trùng → Prisma `P2002` → ta map thành **409 Conflict** (business), không phải 500.

### Ownership + place thuộc trip

1. Trip phải của `userId` (giống places).
2. `placeId` phải thuộc **cùng** `tripId` — không gắn place trip A vào itinerary trip B.
3. `dayNumber` trong khoảng `1 … trip.days`.

### Reorder atomic (có trong kiến trúc)

Khi đổi thứ tự nhiều item một lúc, unique constraint có thể “đụng nhau” giữa chừng.  
Cách đơn giản (đã ghi ở FAQ): trong **transaction**, gán `visitOrder` tạm số âm → rồi gán số cuối.  
Phần C **làm CRUD trước**; endpoint `PATCH .../reorder` làm **bước cuối** (hoặc task nhỏ ngay sau nếu còn thời gian).

### Time fields

DB: `startTime` / `endTime` kiểu `@db.Time`.  
API: string `"HH:mm"` hoặc `"HH:mm:ss"` → convert trong service; response serialize lại string.

---

## 3. API đề xuất

Base: `/trips/:tripId/itinerary` — **nested** trong `TripModule` (không tạo Nest module mới, giống places).

| Method | Path | Việc |
|--------|------|------|
| `GET` | `/trips/:tripId/itinerary` | List (sort `dayNumber`, `slot`, `visitOrder`), kèm place tóm tắt |
| `POST` | `/trips/:tripId/itinerary` | Tạo item |
| `PATCH` | `/trips/:tripId/itinerary/:itemId` | Sửa title/schedule/place/order… |
| `DELETE` | `/trips/:tripId/itinerary/:itemId` | Xóa item |
| `PATCH` | `/trips/:tripId/itinerary/reorder` | *(bước sau CRUD)* body: `[{ itemId, dayNumber, slot, visitOrder }]` atomic |

**Lưu ý route:** khai báo `reorder` **trước** `:itemId` (giống chỗ places trước `:id`), kẻo Nest hiểu `reorder` là `itemId`.

Response success vẫn bọc `{ data }` (global interceptor).

---

## 4. Zod schemas (`packages/shared`)

```ts
daySlotSchema = z.enum(["MORNING", "AFTERNOON", "EVENING"])

createItineraryItemSchema = {
  placeId: uuid,
  dayNumber: int min 1,
  slot: daySlot,
  visitOrder: int min 1,
  title: string,
  description?: string,
  startTime?: "HH:mm" | "HH:mm:ss",
  endTime?: ...,
  durationMin?: int,
  estCost?: number >= 0,
}

updateItineraryItemSchema = create.partial()
reorderItinerarySchema = z.array({ itemId, dayNumber, slot, visitOrder }).min(1)
```

---

## 5. Cấu trúc code

Giữ gọn Phase 1 — **không** tách `PlacesModule` / `ItineraryModule` Nest riêng:

```
trip/
  trip.module.ts
  trip.controller.ts      # thêm routes itinerary
  trip.service.ts         # thêm methods itinerary (+ ownership helpers)
  trip.serializer.ts      # serializeItineraryItem
```

*(Nếu `trip.service.ts` phình quá → tách `itinerary.service.ts` trong cùng module; plan mặc định gộp trước.)*

---

## 6. Thứ tự implement (sau khi bạn OK)

1. Zod schemas shared + export + build  
2. Serializer + service methods (create/list/update/delete) + ownership/place check  
3. Routes trên controller  
4. Seed: vài itinerary item cho trip “Đà Lạt” demo  
5. Tests: unit ownership/unique → 409; integration smoke  
6. *(Tuỳ chọn cùng PR hoặc PR nhỏ)* reorder atomic  

Mentor code **từng bước**, dừng giải thích ngắn, đưa lệnh curl để bạn tự chạy.

---

## 7. Bạn tự test (sau khi code)

```bash
# login
curl -c cookies.txt -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@tripmind.local","password":"password123"}'

# lấy tripId + placeId từ seed / list
curl -b cookies.txt http://localhost:3000/trips
curl -b cookies.txt http://localhost:3000/trips/<tripId>/places

# tạo itinerary item
curl -b cookies.txt -X POST http://localhost:3000/trips/<tripId>/itinerary \
  -H "Content-Type: application/json" \
  -d '{
    "placeId":"<placeId>",
    "dayNumber":1,
    "slot":"MORNING",
    "visitOrder":1,
    "title":"Thăm Hồ Xuân Hương",
    "startTime":"08:00",
    "estCost":0
  }'

curl -b cookies.txt http://localhost:3000/trips/<tripId>/itinerary
```

Kỳ vọng: `{ "data": ... }`; place của trip khác → 404/400 business; trùng `(day, slot, visitOrder)` → 409.

---

## 8. Phạm vi KHÔNG làm ở bài này

- Kéo-thả UI (web)  
- Catalog / AI điền itinerary  
- Grouped response bắt buộc theo day→slot (list phẳng + sort đủ dùng; group có thể thêm sau)  
- JWT  

---

## 9. Checklist học xong

- [ ] Giải thích Place vs ItineraryItem bằng ví dụ “ghé chợ 2 lần”  
- [ ] Vì sao unique `(tripId, dayNumber, slot, visitOrder)` → 409  
- [ ] Vì sao `placeId` phải thuộc đúng trip  
- [ ] Vì sao route `reorder` khai báo trước `:itemId`  
