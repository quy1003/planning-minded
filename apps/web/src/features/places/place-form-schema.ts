import { createPlaceSchema } from "@tripmind/shared";
import { z } from "zod";

/** HTML number input → coerce; address rỗng = bỏ field. */
export const placeFormSchema = z.object({
  name: createPlaceSchema.shape.name,
  address: z.string().max(500).optional(),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

export type PlaceFormValues = z.infer<typeof placeFormSchema>;

export function toCreatePlaceInput(values: PlaceFormValues) {
  const address = values.address?.trim();
  return {
    name: values.name,
    lat: values.lat,
    lng: values.lng,
    ...(address ? { address } : {}),
  };
}

export function toUpdatePlaceInput(values: PlaceFormValues) {
  const address = values.address?.trim();
  return {
    name: values.name,
    lat: values.lat,
    lng: values.lng,
    address: address ? address : null,
  };
}
