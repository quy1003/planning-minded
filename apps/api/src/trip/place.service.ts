import { HttpStatus, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { CreatePlaceInput, UpdatePlaceInput } from "@tripmind/shared";
import { BusinessException } from "../common/exceptions/business.exception";
import { serializePlace } from "./trip.serializer";
import { TripAccessService } from "./trip-access.service";
import { TripRepository } from "./trip.repository";

@Injectable()
export class PlaceService {
  constructor(
    private readonly repository: TripRepository,
    private readonly access: TripAccessService,
  ) {}

  async addPlace(userId: string, tripId: string, input: CreatePlaceInput) {
    await this.access.requireOwnedTrip(userId, tripId, false);
    const place = await this.repository.createPlace(tripId, input);
    return serializePlace(place);
  }

  async listPlaces(userId: string, tripId: string) {
    await this.access.requireOwnedTrip(userId, tripId, false);
    const places = await this.repository.findPlacesByTrip(tripId);
    return places.map(serializePlace);
  }

  async updatePlace(userId: string, tripId: string, placeId: string, input: UpdatePlaceInput) {
    await this.access.requireOwnedTrip(userId, tripId, false);
    await this.access.requireOwnedPlace(tripId, placeId);

    const place = await this.repository.updatePlace(placeId, input);
    return serializePlace(place);
  }

  async deletePlace(userId: string, tripId: string, placeId: string): Promise<void> {
    await this.access.requireOwnedTrip(userId, tripId, false);
    await this.access.requireOwnedPlace(tripId, placeId);
    try {
      await this.repository.deletePlace(placeId);
    } catch (error: unknown) {
      // Restrict: place đang được itinerary tham chiếu
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
        throw new BusinessException(
          "Place is still used by itinerary items",
          HttpStatus.CONFLICT,
        );
      }
      throw error;
    }
  }
}
