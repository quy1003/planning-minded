# Bài giảng — Trip CRUD (Phase 1)

> Trạng thái: **Phần A+B+C đã code** (Trip + Places + Itinerary). Chi tiết itinerary: `11-itinerary-crud.md`.  
> Đọc kèm: `docs/06-database-schema.md`, `docs/01-requirements.md` Epic C, `docs/diary.md`.

---

## 1. Task này làm gì?

Sau Auth, user đã đăng nhập được. Giờ làm **quản lý chuyến đi thủ công**:

- Tạo / xem / sửa / xóa **Trip**
- Thêm **Place** (địa điểm có lat/lng) thuộc trip
- (Phần sau trong cùng epic) **ItineraryItem** — sắp place vào ngày/slot/thứ tự

AI **không** cần cho task này. Trip từ AI sau này cũng dùng cùng model.

---

## 2. Vì sao cần (bối cảnh junior)

Không có Trip API thì không có sản phẩm: web chỉ login được, chưa “lên plan”.  
Mọi trip gắn `userId` lấy từ **session** (`@CurrentUser()`), **không** tin `userId` trong body (tránh sửa trip người khác).

---

## 3. Khái niệm / mô hình dữ liệu

### 3.1 Ba bảng (theo `06-database-schema.md`)

```
Trip 1 ─── * Place
Trip 1 ─── * ItineraryItem
Place 1 ── * ItineraryItem
```

| Model | Vai trò |
|---|---|
| **Trip** | “Chuyến Đà Lạt 3 ngày” — title, ngày, budget, status |
| **Place** | Điểm trên bản đồ (tên + lat/lng), **snapshot** trong trip |
| **ItineraryItem** | “Ngày 2, buổi sáng, thứ tự 1: thăm Hồ Xuân Hương” — trỏ tới Place |

**Vì sao tách Place và ItineraryItem?**  
Cùng một chỗ (chợ) có thể ghé **2 lần** trong trip → 1 Place, 2 ItineraryItem.

**Vì sao `userId` không FK sang `users`?**  
Doc thiết kế cho ngày tách `auth_db` / `trip_db`. Phase 1 cùng 1 Postgres vẫn **không** FK — chỉ lưu `userId` string + index. Ownership check trong service.

### 3.2 Enum

- `TripStatus`: `DRAFT` | `PLANNED` | `COMPLETED`
- `DaySlot`: `MORNING` | `AFTERNOON` | `EVENING`

### 3.3 Ownership (bắt buộc)

```
request → SessionAuthGuard → @CurrentUser() user
→ service chỉ query/update trip WHERE id = ? AND userId = user.id
→ không thấy / không phải chủ → 404 (không lộ trip người khác tồn tại bằng 403)
```

Trade-off 404 vs 403: dùng **404** khi “không tìm thấy trong phạm vi của bạn” — tránh enumeration.

### 3.4 Response format (đã có)

- Success: `{ "data": ... }`
- Lỗi: problem+json + `category: business | system`

---

## 4. API sẽ có (roadmap nhỏ)

### Phần A — Trip shell (làm trước)

| Method | Path | Việc |
|---|---|---|
| `POST` | `/trips` | Tạo trip |
| `GET` | `/trips` | List trip của tôi |
| `GET` | `/trips/:id` | Chi tiết (+ places, itinerary nếu có) |
| `PATCH` | `/trips/:id` | Sửa metadata |
| `DELETE` | `/trips/:id` | Xóa (cascade places/items) |

### Phần B — Places (lồng dưới trip)

| Method | Path | Việc |
|---|---|---|
| `POST` | `/trips/:tripId/places` | Thêm địa điểm |
| `GET` | `/trips/:tripId/places` | List |
| `PATCH` | `/trips/:tripId/places/:placeId` | Sửa |
| `DELETE` | `/trips/:tripId/places/:placeId` | Xóa (chặn nếu còn itinerary — Restrict) |

### Phần C — Itinerary (làm sau A+B nếu cần tách PR)

| Method | Path | Việc |
|---|---|---|
| CRUD | `/trips/:tripId/itinerary` | dayNumber + slot + visitOrder + placeId |

Unique `(tripId, dayNumber, slot, visitOrder)` — trùng thứ tự → 409 business.

---

## 5. Cấu trúc code (giống auth)

```
trip/
  trip.module.ts
  trip.controller.ts
  trip.service.ts
  places/
    places.controller.ts   # hoặc gộp route trong trip.controller
    places.service.ts
  # itinerary/ ... (phần C)
```

`packages/shared`: `createTripSchema`, `updateTripSchema`, `createPlaceSchema`, …

Export `SessionAuthGuard` từ `AuthModule` để `TripModule` dùng.

---

## 6. Thứ tự implement (mentor làm từng bước)

1. Bài giảng này + cập nhật `docs/diary.md`
2. `schema.prisma` + migration + seed trip mẫu cho demo user
3. Zod schemas ở `@tripmind/shared` + build
4. `TripService` / `TripController` + ownership
5. Places nested
6. Tests (unit ownership + integration smoke)
7. Itinerary CRUD (nếu còn trong session / task riêng)

---

## 7. Bạn tự test (sau khi code Phần A)

```bash
# login lấy cookie
curl -c cookies.txt -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@tripmind.local","password":"password123"}'

curl -b cookies.txt -X POST http://localhost:3000/trips \
  -H "Content-Type: application/json" \
  -d '{"title":"Đà Lạt 3 ngày","destinationName":"Đà Lạt","days":3,"partySize":2,"budget":5000000}'

curl -b cookies.txt http://localhost:3000/trips
```

Kỳ vọng: body dạng `{ "data": { ... } }`; không cookie → 401 business.

---

## 8. Phạm vi KHÔNG làm ở bài này

- Catalog service / tìm POI từ catalog  
- AI plan / RAG  
- Reorder kéo-thả phức tạp (sẽ có khi làm itinerary reorder)  
- JWT (Phase 2)  
- Frontend map  

---

## 9. Checklist học xong bài

- [ ] Giải thích được vì sao tách Place vs ItineraryItem  
- [ ] `userId` lấy từ đâu, vì sao không lấy từ body  
- [ ] Cascade xóa trip vs Restrict xóa place đang dùng  
- [ ] Phân biệt 401 (chưa login) vs 404 (không phải trip của tôi)  
