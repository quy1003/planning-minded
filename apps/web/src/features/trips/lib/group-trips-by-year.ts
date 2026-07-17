import type { Trip } from "../types";

export type TripYearGroup = {
  /** null = trip chưa có startDate. */
  year: number | null;
  trips: Trip[];
};

function startDateTime(trip: Trip): number {
  if (!trip.startDate) return 0;
  const time = new Date(trip.startDate).getTime();
  return Number.isNaN(time) ? 0 : time;
}

/**
 * Nhóm trip theo năm của startDate, mới nhất trước.
 * Nhóm `year: null` (chưa có startDate) luôn đứng đầu danh sách.
 */
export function groupTripsByYear(trips: Trip[]): TripYearGroup[] {
  const tripsByYear = new Map<number | null, Trip[]>();

  for (const trip of trips) {
    const year = trip.startDate ? new Date(trip.startDate).getFullYear() : null;
    const existing = tripsByYear.get(year);
    if (existing) {
      existing.push(trip);
    } else {
      tripsByYear.set(year, [trip]);
    }
  }

  const groups = Array.from(tripsByYear.entries()).map(([year, tripsInYear]) => ({
    year,
    trips: [...tripsInYear].sort((a, b) => startDateTime(b) - startDateTime(a)),
  }));

  groups.sort((a, b) => {
    if (a.year === null) return -1;
    if (b.year === null) return 1;
    return b.year - a.year;
  });

  return groups;
}
