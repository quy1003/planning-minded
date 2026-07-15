import type { Place, Trip } from "@prisma/client";

/** Prisma Decimal → string (tránh mất chính xác float JSON). */
export function serializeTrip(trip: Trip & { places?: Place[] }) {
  return {
    id: trip.id,
    userId: trip.userId,
    title: trip.title,
    destinationName: trip.destinationName,
    startDate: trip.startDate ? trip.startDate.toISOString().slice(0, 10) : null,
    days: trip.days,
    partySize: trip.partySize,
    budget: trip.budget.toString(),
    currency: trip.currency,
    status: trip.status,
    aiSessionId: trip.aiSessionId,
    createdAt: trip.createdAt.toISOString(),
    updatedAt: trip.updatedAt.toISOString(),
    places: trip.places?.map(serializePlace),
  };
}

export function serializePlace(place: Place) {
  return {
    id: place.id,
    tripId: place.tripId,
    name: place.name,
    address: place.address,
    lat: place.lat.toString(),
    lng: place.lng.toString(),
    catalogPlaceId: place.catalogPlaceId,
    createdAt: place.createdAt.toISOString(),
  };
}
