import { HttpStatus } from "@nestjs/common";
import { BusinessException } from "../common/exceptions/business.exception";
import { TripService } from "./trip.service";

describe("TripService ownership (unit-ish with stub prisma)", () => {
  it("getForUser throws business 404 when trip missing", async () => {
    const prisma = {
      trip: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    };
    const service = new TripService(prisma as never);

    await expect(service.getForUser("user-1", "trip-1")).rejects.toBeInstanceOf(BusinessException);
    try {
      await service.getForUser("user-1", "trip-1");
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(BusinessException);
      expect((error as BusinessException).getStatus()).toBe(HttpStatus.NOT_FOUND);
    }
  });
});
