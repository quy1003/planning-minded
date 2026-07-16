import { HttpStatus } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { BusinessException } from "../common/exceptions/business.exception";
import { ItineraryService } from "./itinerary.service";

describe("ItineraryService (unit-ish with stub repository/access)", () => {
  it("addItineraryItem maps unique violation to business 409", async () => {
    const repository = {
      createItineraryItem: jest
        .fn()
        .mockRejectedValue(
          new Prisma.PrismaClientKnownRequestError("Unique constraint", {
            code: "P2002",
            clientVersion: "test",
          }),
        ),
    };
    const access = {
      requireOwnedTrip: jest.fn().mockResolvedValue({ id: "trip-1", userId: "user-1", days: 3 }),
      requireOwnedPlace: jest.fn().mockResolvedValue({ id: "place-1", tripId: "trip-1" }),
    };
    const service = new ItineraryService(repository as never, access as never);

    await expect(
      service.addItineraryItem("user-1", "trip-1", {
        placeId: "00000000-0000-0000-0000-000000000001",
        dayNumber: 1,
        slot: "MORNING",
        visitOrder: 1,
        title: "Dup",
      }),
    ).rejects.toBeInstanceOf(BusinessException);

    try {
      await service.addItineraryItem("user-1", "trip-1", {
        placeId: "00000000-0000-0000-0000-000000000001",
        dayNumber: 1,
        slot: "MORNING",
        visitOrder: 1,
        title: "Dup",
      });
    } catch (error: unknown) {
      expect((error as BusinessException).getStatus()).toBe(HttpStatus.CONFLICT);
    }
  });

  it("addItineraryItem rejects dayNumber outside trip.days", async () => {
    const repository = {};
    const access = {
      requireOwnedTrip: jest.fn().mockResolvedValue({ id: "trip-1", userId: "user-1", days: 2 }),
    };
    const service = new ItineraryService(repository as never, access as never);

    try {
      await service.addItineraryItem("user-1", "trip-1", {
        placeId: "00000000-0000-0000-0000-000000000001",
        dayNumber: 5,
        slot: "MORNING",
        visitOrder: 1,
        title: "Too far",
      });
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(BusinessException);
      expect((error as BusinessException).getStatus()).toBe(HttpStatus.BAD_REQUEST);
    }
  });
});
