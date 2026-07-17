import { z } from "zod";
import { isTimeInSlot } from "./itinerary-slot-time";

export const tripStatusSchema = z.enum(["DRAFT", "PLANNED", "COMPLETED"]);
export type TripStatus = z.infer<typeof tripStatusSchema>;

/**
 * Tiền dạng string thập phân (vd "1000000" hoặc "1000000.50"), không âm, tối đa 2 chữ số lẻ.
 * Nhận string thay vì number để tránh sai số float của JS trước khi vào Prisma.Decimal
 * (vd 0.1 + 0.2 !== 0.3) — string đi thẳng vào Decimal, giữ chính xác tuyệt đối.
 */
const moneySchema = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, "phải là chuỗi số thập phân không âm, tối đa 2 chữ số sau dấu phẩy");

export const createTripSchema = z.object({
  title: z.string().min(1).max(200),
  destinationName: z.string().min(1).max(200),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "startDate phải dạng YYYY-MM-DD")
    .optional(),
  days: z.number().int().min(1).max(60),
  partySize: z.number().int().min(1).max(50),
  budget: moneySchema,
  currency: z.string().length(3).default("VND"),
  status: tripStatusSchema.optional(),
});

export type CreateTripInput = z.infer<typeof createTripSchema>;

export const updateTripSchema = createTripSchema.partial().extend({
  // .nullable() thêm ở đây (không phải ở createTripSchema) vì chỉ lúc UPDATE mới có khái niệm
  // "xóa ngày khởi hành đã đặt" — lúc tạo mới thì "không có" nghĩa là bỏ qua field, không phải xóa gì.
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "startDate phải dạng YYYY-MM-DD")
    .nullable()
    .optional(),
});
export type UpdateTripInput = z.infer<typeof updateTripSchema>;

export const createPlaceSchema = z.object({
  name: z.string().min(1).max(200),
  address: z.string().max(500).optional(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  catalogPlaceId: z.string().uuid().optional(),
});

export type CreatePlaceInput = z.infer<typeof createPlaceSchema>;

export const updatePlaceSchema = createPlaceSchema.partial().extend({
  address: z.string().max(500).nullable().optional(),
  catalogPlaceId: z.string().uuid().nullable().optional(),
});
export type UpdatePlaceInput = z.infer<typeof updatePlaceSchema>;

export const daySlotSchema = z.enum(["MORNING", "AFTERNOON", "EVENING"]);
export type DaySlot = z.infer<typeof daySlotSchema>;

/** Giờ trong ngày: HH:mm hoặc HH:mm:ss */
const timeOfDaySchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, "time phải dạng HH:mm hoặc HH:mm:ss");

const itineraryItemBaseSchema = z.object({
  placeId: z.string().uuid(),
  dayNumber: z.number().int().min(1).max(60),
  slot: daySlotSchema,
  visitOrder: z.number().int().min(1).max(100),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  startTime: timeOfDaySchema.optional(),
  endTime: timeOfDaySchema.optional(),
  durationMin: z.number().int().min(1).max(24 * 60).optional(),
  estCost: moneySchema.optional(),
});

/**
 * Ràng buộc chéo: startTime/endTime (nếu có) phải nằm trong khung giờ của `slot` đã chọn,
 * và endTime phải sau startTime. Dùng chung cho cả create/update — .partial() không gọi được
 * sau .superRefine() nên phải tách base schema ra rồi refine riêng ở mỗi bên.
 */
function refineItineraryTimes(
  data: { slot?: DaySlot; startTime?: string | null; endTime?: string | null },
  ctx: z.RefinementCtx,
): void {
  const { slot, startTime, endTime } = data;
  if (slot && startTime && !isTimeInSlot(startTime, slot)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["startTime"],
      message: `startTime không nằm trong khung giờ của buổi ${slot}`,
    });
  }
  if (slot && endTime && !isTimeInSlot(endTime, slot)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["endTime"],
      message: `endTime không nằm trong khung giờ của buổi ${slot}`,
    });
  }
  if (startTime && endTime && endTime <= startTime) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["endTime"],
      message: "endTime phải sau startTime",
    });
  }
}

export const createItineraryItemSchema = itineraryItemBaseSchema.superRefine(refineItineraryTimes);

export type CreateItineraryItemInput = z.infer<typeof createItineraryItemSchema>;

export const updateItineraryItemSchema = itineraryItemBaseSchema
  .partial()
  .extend({
    description: z.string().max(2000).nullable().optional(),
    startTime: timeOfDaySchema.nullable().optional(),
    endTime: timeOfDaySchema.nullable().optional(),
    durationMin: z.number().int().min(1).max(24 * 60).nullable().optional(),
  })
  .superRefine(refineItineraryTimes);
export type UpdateItineraryItemInput = z.infer<typeof updateItineraryItemSchema>;

export const reorderItineraryItemSchema = z.object({
  itemId: z.string().uuid(),
  dayNumber: z.number().int().min(1).max(60),
  slot: daySlotSchema,
  visitOrder: z.number().int().min(1).max(100),
});

export const reorderItinerarySchema = z.array(reorderItineraryItemSchema).min(1).max(200);
export type ReorderItineraryInput = z.infer<typeof reorderItinerarySchema>;
