import { z } from "zod";
import { moneySchema } from "../common/schemas";

export const createDestinationSchema = z.object({
  name: z.string().min(1).max(200),
  region: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  bestSeasons: z.array(z.string().min(1).max(20)).optional(),
  tags: z.array(z.string().min(1).max(50)).optional(),
});
export type CreateDestinationInput = z.infer<typeof createDestinationSchema>;

export const updateDestinationSchema = createDestinationSchema.partial();
export type UpdateDestinationInput = z.infer<typeof updateDestinationSchema>;

/** `?tags=a,b&region=X` — filter D3 (tìm kiếm/duyệt theo tags, vùng miền). */
export const listDestinationsQuerySchema = z.object({
  region: z.string().min(1).max(200).optional(),
  tags: z.string().min(1).max(500).optional(),
});
export type ListDestinationsQuery = z.infer<typeof listDestinationsQuerySchema>;

export const poiCategorySchema = z.enum(["food", "sightseeing", "activity", "accommodation", "transport"]);
export type PoiCategory = z.infer<typeof poiCategorySchema>;

const openingHoursSchema = z.record(z.string(), z.array(z.tuple([z.string(), z.string()])));

export const createPoiSchema = z
  .object({
    name: z.string().min(1).max(200),
    address: z.string().max(500).optional(),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    category: poiCategorySchema,
    description: z.string().min(1).max(2000),
    estCostMin: moneySchema,
    estCostMax: moneySchema,
    avgDurationMin: z.number().int().min(1).max(24 * 60),
    openingHours: openingHoursSchema.optional(),
    tags: z.array(z.string().min(1).max(50)).optional(),
    kidFriendly: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (Number(data.estCostMax) < Number(data.estCostMin)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["estCostMax"],
        message: "estCostMax phải >= estCostMin",
      });
    }
  });
export type CreatePoiInput = z.infer<typeof createPoiSchema>;

export const updatePoiSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  address: z.string().max(500).nullable().optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  category: poiCategorySchema.optional(),
  description: z.string().min(1).max(2000).optional(),
  estCostMin: moneySchema.optional(),
  estCostMax: moneySchema.optional(),
  avgDurationMin: z.number().int().min(1).max(24 * 60).optional(),
  openingHours: openingHoursSchema.nullable().optional(),
  tags: z.array(z.string().min(1).max(50)).optional(),
  kidFriendly: z.boolean().optional(),
});
export type UpdatePoiInput = z.infer<typeof updatePoiSchema>;
