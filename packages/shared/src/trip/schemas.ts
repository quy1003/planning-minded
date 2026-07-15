import { z } from "zod";

export const tripStatusSchema = z.enum(["DRAFT", "PLANNED", "COMPLETED"]);
export type TripStatus = z.infer<typeof tripStatusSchema>;

export const createTripSchema = z.object({
  title: z.string().min(1).max(200),
  destinationName: z.string().min(1).max(200),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "startDate phải dạng YYYY-MM-DD")
    .optional(),
  days: z.number().int().min(1).max(60),
  partySize: z.number().int().min(1).max(50),
  budget: z.number().nonnegative(),
  currency: z.string().length(3).default("VND"),
  status: tripStatusSchema.optional(),
});

export type CreateTripInput = z.infer<typeof createTripSchema>;

export const updateTripSchema = createTripSchema.partial();
export type UpdateTripInput = z.infer<typeof updateTripSchema>;

export const createPlaceSchema = z.object({
  name: z.string().min(1).max(200),
  address: z.string().max(500).optional(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  catalogPlaceId: z.string().uuid().optional(),
});

export type CreatePlaceInput = z.infer<typeof createPlaceSchema>;

export const updatePlaceSchema = createPlaceSchema.partial();
export type UpdatePlaceInput = z.infer<typeof updatePlaceSchema>;
