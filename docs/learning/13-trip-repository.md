# Bài giảng — Phần E: Tách Repository layer khỏi TripService

> Trạng thái: **kế hoạch, chờ xác nhận**. Chen ngang giữa lúc đang làm `12-trip-itinerary-fixes.md`
> (đã xong fix #1, còn #2, #3, #4, #5).

---

## 1. Vì sao cần?

`trip.service.ts` hiện ~320 dòng, method nào cũng có ít nhất 1-2 dòng gọi thẳng
`this.prisma.trip.findFirst(...)`, `this.prisma.place.create(...)`, v.v — logic nghiệp vụ
(check quyền sở hữu, check ngày hợp lệ, map lỗi Prisma → lỗi business) bị trộn lẫn với
câu query thô. Đọc 1 method phải vừa hiểu "làm gì" vừa hiểu "Prisma query này trả gì".

Tách riêng: **Repository** chỉ lo query DB (biết Prisma), **Service** chỉ lo quy tắc
nghiệp vụ (không biết Prisma tồn tại, chỉ gọi method có tên rõ nghĩa).

## 2. Khái niệm: Repository pattern (mức junior)

Repository = 1 class đứng giữa Service và ORM (Prisma), có nhiệm vụ duy nhất: **đọc/ghi DB**.
Service gọi repository như gọi 1 "từ điển nghiệp vụ" (`findOwnedTrip`, `createPlace`...)
thay vì viết query Prisma trực tiếp.

**Lưu ý quan trọng:** `CLAUDE.md` hiện ghi *"repository qua Prisma"* — nghĩa là quy ước gốc
của dự án coi **Prisma chính là repository** (không có thêm lớp nào nữa), inject thẳng
`PrismaService` vào service. Việc thêm 1 class `TripRepository` là đi xa hơn quy ước gốc
một bước. Tôi cho là hợp lý ở đây vì service đã phình to, nhưng đây là lựa chọn có đánh đổi:

| | Giữ như hiện tại (Prisma trực tiếp) | Thêm TripRepository |
|---|---|---|
| Ưu điểm | Ít file, ít gián tiếp, đúng quy ước gốc | Service đọc như văn xuôi nghiệp vụ, dễ test (mock repository thay vì mock shape Prisma) |
| Nhược điểm | Service dài, khó đọc khi nhiều method | Thêm 1 lớp gián tiếp, phải nhớ tra 2 file khi debug |

Không tách Nest module riêng, không tạo interface abstract (`ITripRepository`) — chỉ có
đúng 1 implementation (Prisma) nên interface là thừa (YAGNI).

## 3. Thiết kế

### File mới: `apps/api/src/trip/trip.repository.ts`

`TripRepository` (`@Injectable()`, inject `PrismaService`) — chỉ chứa Prisma call thô,
**không** ném `BusinessException`, **không** biết "quyền sở hữu" là gì (chỉ nhận `tripId`/`userId`
làm điều kiện `where`, trả `null` nếu không thấy — service tự quyết định null nghĩa là 404):

```
createTrip(data)
findManyTripsByUser(userId)
findOwnedTrip(userId, tripId, includePlaces)   // where { id, userId }, trả null nếu không có
updateTrip(tripId, data)
deleteTrip(tripId)

createPlace(data)
findPlacesByTrip(tripId)
findOwnedPlace(tripId, placeId)                // where { id, tripId }
updatePlace(placeId, data)
deletePlace(placeId)                           // để nguyên lỗi P2003 ném ra, service catch

findItineraryByTrip(tripId)                    // include place, sort day/slot/order
findItineraryMetaByTrip(tripId)                // chỉ id/dayNumber/slot/visitOrder (cho reorder pre-flight)
createItineraryItem(data)
findOwnedItineraryItem(tripId, itemId)
updateItineraryItem(itemId, data)
deleteItineraryItem(itemId)
reorderTransaction(items)                      // 2 pha (âm tạm → gán cuối) trong $transaction, trả list sort sẵn
```

`parseTimeOfDay` (chuyển "HH:mm" → Date) chuyển vào `trip.repository.ts` — vì nó là chi tiết
"Prisma lưu time thế nào", không phải quy tắc nghiệp vụ.

### Ở lại `trip.service.ts` (business logic thuần)

- Ownership check: gọi `repository.findOwnedTrip(...)`, nếu `null` → `throw new BusinessException(404)`.
- `assertDayInTrip` (dayNumber phải trong `1..trip.days`).
- Map lỗi hạ tầng → lỗi nghiệp vụ: bắt `P2002`/`P2003` từ repository, ném `BusinessException` tương ứng
  (giữ ở service vì đây là quyết định "lỗi này nghĩa là gì với người dùng", không phải chi tiết Prisma).
- Pre-flight check reorder (fix #1 vừa làm) — dùng dữ liệu từ `findItineraryMetaByTrip`.
- Serialize response (giữ nguyên `trip.serializer.ts`, không đổi).

## 4. Ảnh hưởng tới các fix đang làm dở (`12-trip-itinerary-fixes.md`)

- **Fix #3 (ownership check bị query lặp)** coi như được giải quyết luôn bởi refactor này:
  `findOwnedPlace`/`findOwnedItineraryItem` ở repository chỉ nhận `tripId` (không tự query lại trip) —
  đúng ý fix #3, không cần làm riêng nữa.
- **Fix #1 (đã xong)** sẽ dời phần transaction 2 pha vào `reorderTransaction` ở repository;
  phần pre-flight check + catch lỗi vẫn ở service.
- **Fix #2, #4, #5** sẽ code tiếp *sau* refactor này, trên cấu trúc mới (ít việc hơn vì
  service đã gọn).

## 5. Ảnh hưởng tới test hiện có

`trip.service.spec.ts` hiện mock thẳng shape Prisma client rồi `new TripService(prisma as never)`.
Sau refactor, `TripService` nhận `TripRepository` (không phải `PrismaService`) → phải viết lại
3 test case đó để mock `TripRepository` (mock method `findOwnedTrip`, `createItineraryItem`...
thay vì mock `prisma.trip.findFirst`...). Đây là thay đổi bắt buộc đi kèm, không phải phát sinh ngoài ý muốn.

`trip.integration-spec.ts` **không đổi** — nó gọi qua HTTP, không quan tâm bên trong tách lớp thế nào.

## 6. Phạm vi KHÔNG làm

- Không tách `PlacesModule`/`ItineraryModule` Nest riêng.
- Không tạo interface `ITripRepository` (chỉ 1 impl, chưa cần).
- Không đổi `trip.module.ts` ngoài việc thêm `TripRepository` vào `providers`.
- Không đổi `trip.serializer.ts`, `trip.controller.ts`.

## 7. Thứ tự implement (từng bước nhỏ, dừng giải thích sau mỗi bước)

1. Tạo `trip.repository.ts` — method cho Trip (create/list/find/update/delete).
2. Thêm method cho Place vào cùng file.
3. Thêm method cho ItineraryItem + dời `parseTimeOfDay` vào đây.
4. Thêm `findItineraryMetaByTrip` + `reorderTransaction`.
5. Sửa `trip.service.ts`: đổi constructor sang inject `TripRepository`, thay từng lời gọi
   `this.prisma.xxx` bằng `this.repository.xxx`, xóa `isUniqueViolation`/`parseTimeOfDay` khỏi service
   nếu đã dời hết.
6. Đăng ký `TripRepository` vào `providers` của `trip.module.ts`.
7. Sửa `trip.service.spec.ts` để mock `TripRepository` thay vì mock Prisma.
8. Chạy `pnpm lint && pnpm typecheck && pnpm test`.
9. Quay lại làm tiếp fix #2/#4/#5 trên cấu trúc mới.

## 8. Bạn tự test sau khi xong

```bash
pnpm --filter @tripmind/api typecheck
pnpm --filter @tripmind/api test trip.service.spec.ts
pnpm --filter @tripmind/api test trip.integration-spec.ts   # cần docker compose postgres chạy sẵn
```

Kỳ vọng: không đổi behavior nào (response y hệt trước) — refactor thuần, không đổi API contract.

---

## Checklist học xong

- [ ] Giải thích Repository pattern bằng 1 câu cho người chưa biết
- [ ] Vì sao repository không nên tự ném `BusinessException` (đó là việc của service)
- [ ] Vì sao không cần interface `ITripRepository` ở giai đoạn này
