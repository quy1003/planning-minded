import type {
  CreateItineraryItemInput,
  ReorderItineraryInput,
  UpdateItineraryItemInput,
} from "@tripmind/shared";
import { api } from "@/lib/api-client";
import type { ItineraryItem } from "./types";

export function listItinerary(tripId: string) {
  return api.get<ItineraryItem[]>(`/trips/${tripId}/itinerary`);
}

export function createItineraryItem(tripId: string, body: CreateItineraryItemInput) {
  return api.post<ItineraryItem>(`/trips/${tripId}/itinerary`, body);
}

export function updateItineraryItem(
  tripId: string,
  itemId: string,
  body: UpdateItineraryItemInput,
) {
  return api.patch<ItineraryItem>(`/trips/${tripId}/itinerary/${itemId}`, body);
}

export function deleteItineraryItem(tripId: string, itemId: string) {
  return api.delete<void>(`/trips/${tripId}/itinerary/${itemId}`);
}

export function reorderItinerary(tripId: string, body: ReorderItineraryInput) {
  return api.patch<ItineraryItem[]>(`/trips/${tripId}/itinerary/reorder`, body);
}
