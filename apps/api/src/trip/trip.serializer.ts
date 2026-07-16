import type { ItineraryItem, Place, Trip } from "@prisma/client";

/** Prisma @db.Time → "HH:mm:ss" (UTC portion của Date Prisma trả về). */
function serializeTime(value: Date | null): string | null {
  if (!value) return null;
  return value.toISOString().slice(11, 19);
}

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

export function serializeItineraryItem(
  itineraryItem: ItineraryItem & { place?: Place },
) {
  return {
    id: itineraryItem.id,
    tripId: itineraryItem.tripId,
    placeId: itineraryItem.placeId,
    dayNumber: itineraryItem.dayNumber,
    slot: itineraryItem.slot,
    visitOrder: itineraryItem.visitOrder,
    startTime: serializeTime(itineraryItem.startTime),
    endTime: serializeTime(itineraryItem.endTime),
    durationMin: itineraryItem.durationMin,
    title: itineraryItem.title,
    description: itineraryItem.description,
    estCost: itineraryItem.estCost.toString(),
    createdAt: itineraryItem.createdAt.toISOString(),
    updatedAt: itineraryItem.updatedAt.toISOString(),
    place: itineraryItem.place ? serializePlace(itineraryItem.place) : undefined,
  };
}
