import type { DaySlot } from "@tripmind/shared";
import type { Place } from "@/features/places/types";

export type ItineraryItem = {
  id: string;
  tripId: string;
  placeId: string;
  dayNumber: number;
  slot: DaySlot;
  visitOrder: number;
  startTime: string | null;
  endTime: string | null;
  durationMin: number | null;
  title: string;
  description: string | null;
  estCost: string;
  createdAt: string;
  updatedAt: string;
  place?: Place;
};

export const DAY_SLOTS: DaySlot[] = ["MORNING", "AFTERNOON", "EVENING"];
