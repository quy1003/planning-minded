# Bài giảng — Phần D: Sửa 5 vấn đề từ code review Trip/Itinerary

> Trạng thái: **kế hoạch, chờ xác nhận**. Nối tiếp `11-itinerary-crud.md`.
> Không đổi kiến trúc (vẫn modular monolith, vẫn gộp trong `trip/`) — chỉ sửa logic/schema.

---

## Việc cần làm & vì sao

### 1. `reorderItinerary` có thể ném lỗi 500 thô thay vì 409

**Vị trí:** [apps/api/src/trip/trip.service.ts:236-279](apps/api/src/trip/trip.service.ts#L236-L279) — hàm `reorderItinerary`.

**Vấn đề:** cơ chế "gán `visitOrder` âm tạm rồi gán lại" chỉ tránh đụng độ **giữa các item nằm trong payload**. Nếu vị trí mới trùng với 1 item **không nằm trong payload** (không được kéo-thả), Prisma ném `P2002` ở vòng gán cuối — nhưng hàm này không `catch` như `addItineraryItem`/`updateItineraryItem`, nên lỗi lọt ra ngoài thành 500.

**Cách sửa:**
- Trước khi vào transaction: lấy toàn bộ itinerary item hiện có của trip (kèm `dayNumber/slot/visitOrder`), so sánh vị trí đích của từng item trong payload với vị trí hiện tại của **item KHÔNG nằm trong payload** → nếu trùng, ném `BusinessException(409)` ngay, thông báo rõ ràng.
- Vẫn bọc `try/catch` quanh `$transaction` để bắt `P2002` còn sót (phòng trường hợp có request khác chèn thêm dữ liệu đúng lúc này — race condition), map thành 409 giống các hàm khác.

**Khái niệm:** đây gọi là "pre-flight check" (kiểm tra trước khi làm) kết hợp "defense in depth" (vẫn giữ catch ở tầng DB làm lưới an toàn cuối, dù đã check trước).

---

### 2. Update schema không "xóa" được field optional (set null)

**Vị trí:**
- Schema: [packages/shared/src/trip/schemas.ts:22](packages/shared/src/trip/schemas.ts#L22) (`updateTripSchema`, field `startDate`), [:35](packages/shared/src/trip/schemas.ts#L35) (`updatePlaceSchema`, field `address`/`catalogPlaceId`), [:61](packages/shared/src/trip/schemas.ts#L61) (`updateItineraryItemSchema`, field `description`/`startTime`/`endTime`/`durationMin`).
- Service — chỗ đang set các field này theo kiểu `if (input.x !== undefined) data.x = ...`:
  - `updateForUser` → `startDate` ở [trip.service.ts:66](apps/api/src/trip/trip.service.ts#L66)
  - `updatePlace` → `address` ở [trip.service.ts:111](apps/api/src/trip/trip.service.ts#L111), `catalogPlaceId` ở [:114](apps/api/src/trip/trip.service.ts#L114)
  - `updateItineraryItem` → `description` ở [trip.service.ts:202](apps/api/src/trip/trip.service.ts#L202), `startTime`/`endTime` ở [:203-204](apps/api/src/trip/trip.service.ts#L203-L204), `durationMin` ở [:205](apps/api/src/trip/trip.service.ts#L205)

**Vấn đề:** `updateXxxSchema = createXxxSchema.partial()` chỉ cho 2 trạng thái: bỏ qua field (giữ nguyên) hoặc gửi giá trị mới. Không gửi được `null` để xóa `address`, `description`, `catalogPlaceId`, `startTime`, `endTime`, `durationMin`, `startDate` — dù DB cho phép các cột này là `NULL`.

**Cách sửa:** với các field trên, đổi validation **chỉ trong schema update** (create thì giữ nguyên, vì lúc tạo mới không có khái niệm "xóa") từ `.optional()` (`T | undefined`) thành `.nullable().optional()` (`T | null | undefined`). Trong service, phân biệt rõ:
- `undefined` → bỏ qua, giữ nguyên giá trị cũ.
- `null` → set về null.
- giá trị → convert (Date/Decimal) rồi set.

**Khái niệm:** `optional` (`?`) khác `nullable`. `optional` = field có thể **không xuất hiện** trong object. `nullable` = field xuất hiện nhưng giá trị có thể là `null`. Update API cần cả hai để phân biệt "không đổi" vs "xóa".

---

### 3. Ownership check bị query lặp lại (dư round-trip DB)

**Vị trí:**
- Hàm private cần sửa signature: `requireOwnedPlace` ở [trip.service.ts:301-310](apps/api/src/trip/trip.service.ts#L301-L310), `requireOwnedItineraryItem` ở [:312-321](apps/api/src/trip/trip.service.ts#L312-L321).
- Call site đang gọi dư (2-3 lần query trip):
  - `addItineraryItem` → dòng gọi `requireOwnedPlace` ở [trip.service.ts:149](apps/api/src/trip/trip.service.ts#L149) (trip đã fetch ở dòng 147)
  - `updateItineraryItem` → gọi `requireOwnedItineraryItem` ở [trip.service.ts:187](apps/api/src/trip/trip.service.ts#L187) và `requireOwnedPlace` ở [:193](apps/api/src/trip/trip.service.ts#L193) (trip đã fetch ở dòng 186)
- Call site cần **thêm** `requireOwnedTrip` trước (hiện đang dựa hoàn toàn vào hàm callee tự check):
  - `updatePlace` ở [trip.service.ts:107](apps/api/src/trip/trip.service.ts#L107)
  - `deletePlace` ở [trip.service.ts:121](apps/api/src/trip/trip.service.ts#L121)
  - `deleteItineraryItem` ở [trip.service.ts:227](apps/api/src/trip/trip.service.ts#L227)

**Vấn đề:** `requireOwnedPlace`/`requireOwnedItineraryItem` tự check lại quyền sở hữu trip bên trong, dù caller (`addItineraryItem`, `updateItineraryItem`) đã check trip ngay phía trên. → dư 1-2 query SELECT trip mỗi request.

**Cách sửa:** đổi 2 hàm private này để nhận thẳng `tripId` (không nhận `userId`, không tự query lại trip) — vì lúc gọi tới đây, trip đã chắc chắn thuộc user (caller đã `requireOwnedTrip` trước đó). Nơi nào gọi trực tiếp 2 hàm này mà **chưa** check trip trước (`updatePlace`, `deletePlace`, `deleteItineraryItem`) thì thêm 1 dòng `requireOwnedTrip` trước, tổng số query không đổi ở các chỗ đó, chỉ giảm ở `addItineraryItem`/`updateItineraryItem`.

**Khái niệm:** đây là factor "ai chịu trách nhiệm check gì" — chuyển từ "mỗi hàm tự bảo vệ chính nó" sang "caller đảm bảo precondition, callee tin tưởng". Đánh đổi: code callee đơn giản hơn nhưng dễ lỗi nếu ai đó gọi callee mà quên check trip trước — nên đặt tên hàm rõ (`requireOwnedPlace` vẫn cần `tripId` làm tham số bắt buộc để nhắc).

---

### 4. `budget` / `estCost` nhận vào là JS `number` → rủi ro sai số thập phân

**Vị trí:**
- Schema: `budget` ở [packages/shared/src/trip/schemas.ts:15](packages/shared/src/trip/schemas.ts#L15) (`createTripSchema`), `estCost` ở [:56](packages/shared/src/trip/schemas.ts#L56) (`createItineraryItemSchema`). `updateTripSchema`/`updateItineraryItemSchema` tự động ăn theo vì dùng `.partial()`.
- Service: `new Prisma.Decimal(input.budget)` ở [trip.service.ts:39](apps/api/src/trip/trip.service.ts#L39) và [:69](apps/api/src/trip/trip.service.ts#L69); `new Prisma.Decimal(input.estCost ?? 0)` ở [:164](apps/api/src/trip/trip.service.ts#L164) và [:206](apps/api/src/trip/trip.service.ts#L206).
- Test cần sửa theo: [apps/api/test/trip.integration-spec.ts:52](apps/api/test/trip.integration-spec.ts#L52) (`budget: 5_000_000` → `"5000000"`) và assertion ở [:60](apps/api/test/trip.integration-spec.ts#L60).

**Vấn đề:** tiền là số nhạy cảm với sai số float (vd `0.1 + 0.2 !== 0.3`). Hiện tại zod parse thành `number` trước khi đưa vào `Prisma.Decimal`, nghĩa là sai số (nếu có) đã xảy ra ở bước parse JSON → number, trước khi Decimal kịp "cứu".

**Cách sửa:** đổi input từ `number` sang `string` dạng thập phân (regex kiểm tra tối đa 2 chữ số sau dấu phẩy, không âm), rồi đưa thẳng string vào `new Prisma.Decimal(string)` — Decimal parse trực tiếp từ string, không qua số thực JS, giữ chính xác tuyệt đối.

**Ảnh hưởng:** đổi **contract API** — client giờ phải gửi `budget: "5000000"` thay vì `budget: 5000000`. Response trả về **không đổi** (đã `toString()` sẵn). Cần sửa integration test cho khớp.

**Khái niệm:** đây là lý do các hệ thống tài chính hay nhận tiền dạng string hoặc "số nguyên nhỏ nhất" (cents) thay vì float.

---

### 5. Giảm `trip.days` không kiểm tra itinerary item đang dùng ngày lớn hơn

**Vị trí:** [apps/api/src/trip/trip.service.ts:60-75](apps/api/src/trip/trip.service.ts#L60-L75) — hàm `updateForUser`, ngay đầu hàm (trước khi build `data`).

**Vấn đề:** sửa trip giảm `days` (vd 5 → 2) trong khi đã có itinerary item ở `dayNumber = 5` → không lỗi, item đó thành "mồ côi" (invalid ngầm, không ai biết).

**Cách sửa:** trong `updateForUser`, nếu `input.days` nhỏ hơn `trip.days` hiện tại, đếm số itinerary item có `dayNumber > input.days`; nếu > 0 → ném `BusinessException(409)` báo rõ đang có bao nhiêu item chặn, không cho giảm.

---

## Phạm vi KHÔNG làm ở bài này

- Không tự động dịch chuyển/xóa itinerary item khi giảm `days` (chỉ chặn, không tự sửa hộ) — tránh mất dữ liệu ngầm.
- Không thêm validate "duplicate itemId trong payload reorder" (đã nhắc ở review nhưng không nằm trong 5 mục được chọn).
- Không refactor gì thêm ngoài 5 điểm trên.

## File sẽ đổi

- `packages/shared/src/trip/schemas.ts` — nullable cho update schemas, đổi budget/estCost sang string.
- `apps/api/src/trip/trip.service.ts` — cả 5 fix.
- `apps/api/test/trip.integration-spec.ts` — sửa `budget` sang string, thêm case cho reorder-collision-ngoài-batch (nếu kịp).
- `apps/api/src/trip/trip.service.spec.ts` — thêm unit test cho fix #5 (giảm days bị chặn) và có thể fix #1.

## Thứ tự implement (từng bước, dừng giải thích sau mỗi bước)

1. Schemas: nullable + budget/estCost string.
2. Service: fix #3 (ownership refactor) trước — vì nó chạm code base cho các fix sau.
3. Service: fix #2 (nullable update logic).
4. Service: fix #4 (budget/estCost string → Decimal).
5. Service: fix #5 (chặn giảm days).
6. Service: fix #1 (reorder pre-flight check + catch).
7. Update test cho khớp, thêm test mới.
8. Chạy `pnpm lint && pnpm typecheck && pnpm test`.

## Bạn tự test sau khi xong (ví dụ)

```bash
# fix 4: budget giờ là string
curl -b cookies.txt -X POST http://localhost:3000/trips \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","destinationName":"Test","days":3,"partySize":2,"budget":"1000000.50"}'

# fix 2: xóa address (set null)
curl -b cookies.txt -X PATCH http://localhost:3000/trips/<tripId>/places/<placeId> \
  -H "Content-Type: application/json" \
  -d '{"address": null}'

# fix 5: giảm days khi đang có item ở ngày lớn hơn → mong đợi 409
curl -b cookies.txt -X PATCH http://localhost:3000/trips/<tripId> \
  -H "Content-Type: application/json" \
  -d '{"days": 1}'
```

---

## Checklist học xong

- [ ] Giải thích khác nhau giữa `optional` và `nullable` trong zod
- [ ] Vì sao tiền nên nhận dạng string thay vì number
- [ ] Vì sao chuyển ownership check sang "caller đảm bảo, callee tin tưởng" lại giảm được query
- [ ] Vì sao reorder cần pre-flight check thay vì chỉ dựa vào catch lỗi DB
