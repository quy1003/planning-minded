import type { Destination, Poi } from "../../generated/prisma-client";

/** Prisma Decimal → string (tránh mất chính xác float JSON). */
export function serializeDestination(destination: Destination & { pois?: Poi[] }) {
  return {
    id: destination.id,
    name: destination.name,
    region: destination.region,
    description: destination.description,
    lat: destination.lat.toString(),
    lng: destination.lng.toString(),
    bestSeasons: destination.bestSeasons,
    tags: destination.tags,
    createdAt: destination.createdAt.toISOString(),
    updatedAt: destination.updatedAt.toISOString(),
    pois: destination.pois?.map(serializePoi),
  };
}

export function serializePoi(poi: Poi) {
  return {
    id: poi.id,
    destinationId: poi.destinationId,
    name: poi.name,
    address: poi.address,
    lat: poi.lat.toString(),
    lng: poi.lng.toString(),
    category: poi.category,
    description: poi.description,
    estCostMin: poi.estCostMin.toString(),
    estCostMax: poi.estCostMax.toString(),
    avgDurationMin: poi.avgDurationMin,
    openingHours: poi.openingHours,
    tags: poi.tags,
    kidFriendly: poi.kidFriendly,
    createdAt: poi.createdAt.toISOString(),
    updatedAt: poi.updatedAt.toISOString(),
  };
}
