import type { CreatePlaceInput, UpdatePlaceInput } from "@tripmind/shared";
import { api } from "@/lib/api-client";
import type { Place } from "./types";

export function listPlaces(tripId: string) {
  return api.get<Place[]>(`/trips/${tripId}/places`);
}

export function createPlace(tripId: string, body: CreatePlaceInput) {
  return api.post<Place>(`/trips/${tripId}/places`, body);
}

export function updatePlace(tripId: string, placeId: string, body: UpdatePlaceInput) {
  return api.patch<Place>(`/trips/${tripId}/places/${placeId}`, body);
}

export function deletePlace(tripId: string, placeId: string) {
  return api.delete<void>(`/trips/${tripId}/places/${placeId}`);
}
