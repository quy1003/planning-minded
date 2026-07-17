/** Chuẩn hoá query keys — invalidate đúng scope, không refetch cả app. */
export const queryKeys = {
  me: ["me"] as const,
  trips: ["trips"] as const,
  trip: (tripId: string) => ["trips", tripId] as const,
  places: (tripId: string) => ["trips", tripId, "places"] as const,
  itinerary: (tripId: string) => ["trips", tripId, "itinerary"] as const,
};
