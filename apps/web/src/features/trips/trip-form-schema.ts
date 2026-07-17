import { createTripSchema, tripStatusSchema } from "@tripmind/shared";
import { z } from "zod";

/**
 * Form schema: HTML input trả string → coerce số.
 * budget giữ string (moneySchema shared). Không dùng .default() để khớp RHF output type.
 */
export const tripFormSchema = z.object({
  title: createTripSchema.shape.title,
  destinationName: createTripSchema.shape.destinationName,
  startDate: z.string().optional(),
  days: z.coerce.number().int().min(1).max(60),
  partySize: z.coerce.number().int().min(1).max(50),
  budget: createTripSchema.shape.budget,
  currency: z.string().length(3),
  status: tripStatusSchema,
});

export type TripFormValues = z.infer<typeof tripFormSchema>;

export function toCreateTripInput(values: TripFormValues) {
  const startDate = values.startDate?.trim();
  return {
    title: values.title,
    destinationName: values.destinationName,
    days: values.days,
    partySize: values.partySize,
    budget: values.budget,
    currency: values.currency,
    status: values.status,
    ...(startDate ? { startDate } : {}),
  };
}

export function toUpdateTripInput(values: TripFormValues) {
  const startDate = values.startDate?.trim();
  return {
    title: values.title,
    destinationName: values.destinationName,
    days: values.days,
    partySize: values.partySize,
    budget: values.budget,
    currency: values.currency,
    status: values.status,
    startDate: startDate ? startDate : null,
  };
}
