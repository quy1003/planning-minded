import type { DaySlot } from "./schemas";

/** Khung giờ (HH:mm) của từng buổi — dùng cho input min/max phía FE và validate phía BE. */
export const SLOT_TIME_RANGES: Record<DaySlot, { min: string; max: string }> = {
  MORNING: { min: "00:00", max: "11:59" },
  AFTERNOON: { min: "12:00", max: "17:59" },
  EVENING: { min: "18:00", max: "23:59" },
};

/** "HH:mm" hoặc "HH:mm:ss" → buổi tương ứng, dựa theo giờ (0-23). */
export function timeToSlot(time: string): DaySlot {
  const hour = Number(time.slice(0, 2));
  if (hour < 12) return "MORNING";
  if (hour < 18) return "AFTERNOON";
  return "EVENING";
}

export function isTimeInSlot(time: string, slot: DaySlot): boolean {
  return timeToSlot(time) === slot;
}
