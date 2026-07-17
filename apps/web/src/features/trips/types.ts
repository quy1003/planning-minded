import type { TripStatus } from "@tripmind/shared";

/** Khớp serializeTrip Nest (budget/startDate dạng string). */
export type Trip = {
  id: string;
  userId: string;
  title: string;
  destinationName: string;
  startDate: string | null;
  days: number;
  partySize: number;
  budget: string;
  currency: string;
  status: TripStatus;
  aiSessionId: string | null;
  createdAt: string;
  updatedAt: string;
  places?: unknown[];
};
