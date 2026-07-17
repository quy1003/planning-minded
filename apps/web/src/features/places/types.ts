/** Khớp serializePlace — lat/lng là string Decimal. */
export type Place = {
  id: string;
  tripId: string;
  name: string;
  address: string | null;
  lat: string;
  lng: string;
  catalogPlaceId: string | null;
  createdAt: string;
};
