import type { DaySlot } from "@tripmind/shared";

const SLOT_RANK: Record<DaySlot, number> = {
  MORNING: 0,
  AFTERNOON: 1,
  EVENING: 2,
};

/** Màu polyline / marker theo ngày (dayNumber % length). */
export const ROUTE_DAY_COLORS = [
  "#0d9488", // teal
  "#ea580c", // orange
  "#7c3aed", // violet
  "#2563eb", // blue
  "#db2777", // pink
] as const;

export type RoutePointInput = {
  dayNumber: number;
  slot: DaySlot;
  visitOrder: number;
  placeId: string;
  name: string;
  lat: number;
  lng: number;
};

export type RouteLineFeature = {
  type: "Feature";
  properties: {
    dayNumber: number;
    colorIndex: number;
  };
  geometry: {
    type: "LineString";
    coordinates: [number, number][];
  };
};

export type RouteGeoJson = {
  type: "FeatureCollection";
  features: RouteLineFeature[];
};

export type PlaceRouteLabel = {
  /** Số thứ tự lần xuất hiện đầu trong phạm vi đang build (1…n). */
  number: number;
  dayNumber: number;
  title: string;
};

export type BuildRoutesResult = {
  geojson: RouteGeoJson;
  placeLabels: Map<string, PlaceRouteLabel>;
  daysWithLines: number[];
};

export type BuildTripRoutesOptions = {
  /** Chỉ lấy điểm của ngày này — số marker reset 1…n trong ngày. */
  filterDay?: number;
};

function parseCoord(value: string): number {
  return Number.parseFloat(value);
}

/**
 * Gộp itinerary (+ fallback list places) thành điểm có tọa độ số.
 * Bỏ item thiếu lat/lng hợp lệ.
 */
export function itineraryToRoutePoints(
  items: Array<{
    dayNumber: number;
    slot: DaySlot;
    visitOrder: number;
    placeId: string;
    place?: { id: string; lat: string; lng: string; name: string } | null;
  }>,
  placesFallback: Array<{ id: string; lat: string; lng: string; name: string }>,
): RoutePointInput[] {
  const byId = new Map(placesFallback.map((p) => [p.id, p]));

  const points: RoutePointInput[] = [];
  for (const item of items) {
    const place = item.place ?? byId.get(item.placeId);
    if (!place) continue;
    const lat = parseCoord(place.lat);
    const lng = parseCoord(place.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    points.push({
      dayNumber: item.dayNumber,
      slot: item.slot,
      visitOrder: item.visitOrder,
      placeId: place.id,
      name: place.name,
      lat,
      lng,
    });
  }
  return points;
}

function sortRoutePoints(a: RoutePointInput, b: RoutePointInput): number {
  return (
    a.dayNumber - b.dayNumber ||
    SLOT_RANK[a.slot] - SLOT_RANK[b.slot] ||
    a.visitOrder - b.visitOrder
  );
}

/**
 * Pure: itinerary points → GeoJSON LineString + số marker.
 * `filterDay` → chỉ ngày đó, số 1…n trong ngày (dùng với tab map).
 */
export function buildTripRoutes(
  points: RoutePointInput[],
  options?: BuildTripRoutesOptions,
): BuildRoutesResult {
  let sorted = [...points].sort(sortRoutePoints);
  if (options?.filterDay != null) {
    sorted = sorted.filter((p) => p.dayNumber === options.filterDay);
  }

  const placeLabels = new Map<string, PlaceRouteLabel>();
  let sequence = 0;
  for (const point of sorted) {
    if (placeLabels.has(point.placeId)) continue;
    sequence += 1;
    placeLabels.set(point.placeId, {
      number: sequence,
      dayNumber: point.dayNumber,
      title: `${point.name} · Ngày ${point.dayNumber}`,
    });
  }

  const byDay = new Map<number, RoutePointInput[]>();
  for (const point of sorted) {
    const list = byDay.get(point.dayNumber) ?? [];
    list.push(point);
    byDay.set(point.dayNumber, list);
  }

  const features: RouteLineFeature[] = [];
  const daysWithLines: number[] = [];

  for (const dayNumber of [...byDay.keys()].sort((a, b) => a - b)) {
    const dayPoints = byDay.get(dayNumber) ?? [];
    if (dayPoints.length < 2) continue;
    const colorIndex = (dayNumber - 1) % ROUTE_DAY_COLORS.length;
    daysWithLines.push(dayNumber);
    features.push({
      type: "Feature",
      properties: { dayNumber, colorIndex },
      geometry: {
        type: "LineString",
        coordinates: dayPoints.map((p) => [p.lng, p.lat]),
      },
    });
  }

  return {
    geojson: { type: "FeatureCollection", features },
    placeLabels,
    daysWithLines,
  };
}

export function emptyRouteGeoJson(): RouteGeoJson {
  return { type: "FeatureCollection", features: [] };
}
