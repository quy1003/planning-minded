// Barrel export cho DTOs, zod schemas, event contracts dùng chung giữa các app.
// Mọi contract liên module/service phải khai báo ở đây — không duplicate (xem docs/05-CLAUDE.md).

export { registerSchema, loginSchema, type RegisterInput, type LoginInput } from "./auth/schemas";

export {
  tripStatusSchema,
  createTripSchema,
  updateTripSchema,
  createPlaceSchema,
  updatePlaceSchema,
  type TripStatus,
  type CreateTripInput,
  type UpdateTripInput,
  type CreatePlaceInput,
  type UpdatePlaceInput,
} from "./trip/schemas";
