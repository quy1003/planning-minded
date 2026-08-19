import { HttpStatus } from "@nestjs/common";
import { BusinessException } from "../common/exceptions/business.exception";
import { TripCrudService } from "./trip-crud.service";

describe("TripCrudService (unit-ish with stub repository/access)", () => {
  it("getForUser propagates business 404 when trip not owned", async () => {
    const repository = {};
    const access = {
      requireOwnedTrip: jest
        .fn()
        .mockRejectedValue(new BusinessException("Trip not found", HttpStatus.NOT_FOUND)),
    };
    const service = new TripCrudService(repository as never, access as never);

    await expect(service.getForUser("user-1", "trip-1")).rejects.toBeInstanceOf(BusinessException);
    try {
      await service.getForUser("user-1", "trip-1");
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(BusinessException);
      expect((error as BusinessException).getStatus()).toBe(HttpStatus.NOT_FOUND);
    }
  });
});
