import { daySlotSchema } from "@tripmind/shared";
import { z } from "zod";

const optionalTime = z
  .string()
  .regex(/^$|^([01]\d|2[0-3]):[0-5]\d$/, "HH:mm")
  .optional();

export const itineraryFormSchema = z.object({
  placeId: z.string().uuid("Chọn một địa điểm"),
  dayNumber: z.coerce.number().int().min(1).max(60),
  slot: daySlotSchema,
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  startTime: optionalTime,
  endTime: optionalTime,
  durationMin: z.string().optional(),
  estCost: z
    .string()
    .regex(/^$|^\d+(\.\d{1,2})?$/, "số thập phân")
    .optional(),
});

export type ItineraryFormValues = z.infer<typeof itineraryFormSchema>;

function cleanTime(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function parseOptionalInt(value: string | undefined): number | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  const n = Number(trimmed);
  return Number.isInteger(n) && n >= 1 && n <= 24 * 60 ? n : undefined;
}

export function toCreateItineraryInput(values: ItineraryFormValues, visitOrder: number) {
  const description = values.description?.trim();
  const startTime = cleanTime(values.startTime);
  const endTime = cleanTime(values.endTime);
  const estCost = values.estCost?.trim();
  const durationMin = parseOptionalInt(values.durationMin);

  return {
    placeId: values.placeId,
    dayNumber: values.dayNumber,
    slot: values.slot,
    visitOrder,
    title: values.title,
    ...(description ? { description } : {}),
    ...(startTime ? { startTime } : {}),
    ...(endTime ? { endTime } : {}),
    ...(durationMin !== undefined ? { durationMin } : {}),
    ...(estCost ? { estCost } : {}),
  };
}

export function toUpdateItineraryInput(values: ItineraryFormValues) {
  const description = values.description?.trim();
  const startTime = cleanTime(values.startTime);
  const endTime = cleanTime(values.endTime);
  const estCost = values.estCost?.trim();
  const durationMin = parseOptionalInt(values.durationMin);

  return {
    placeId: values.placeId,
    dayNumber: values.dayNumber,
    slot: values.slot,
    title: values.title,
    description: description ? description : null,
    startTime: startTime ?? null,
    endTime: endTime ?? null,
    durationMin: durationMin ?? null,
    ...(estCost ? { estCost } : {}),
  };
}

/** time API "HH:mm:ss" → input type="time" "HH:mm" */
export function toTimeInputValue(value: string | null): string {
  if (!value) return "";
  return value.slice(0, 5);
}
