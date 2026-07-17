import type { CreateTripInput, UpdateTripInput } from "@tripmind/shared";
import { api } from "@/lib/api-client";
import type { Trip } from "./types";

export function listTrips() {
  return api.get<Trip[]>("/trips");
}

export function getTrip(tripId: string) {
  return api.get<Trip>(`/trips/${tripId}`);
}

export function createTrip(body: CreateTripInput) {
  return api.post<Trip>("/trips", body);
}

export function updateTrip(tripId: string, body: UpdateTripInput) {
  return api.patch<Trip>(`/trips/${tripId}`, body);
}

export function deleteTrip(tripId: string) {
  return api.delete<void>(`/trips/${tripId}`);
}
