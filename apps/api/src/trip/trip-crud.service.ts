import { HttpStatus, Injectable } from "@nestjs/common";
import type { CreateTripInput, UpdateTripInput } from "@tripmind/shared";
import { BusinessException } from "../common/exceptions/business.exception";
import { serializeTrip } from "./trip.serializer";
import { TripAccessService } from "./trip-access.service";
import { TripRepository } from "./trip.repository";

@Injectable()
export class TripCrudService {
  constructor(
    private readonly repository: TripRepository,
    private readonly access: TripAccessService,
  ) {}

  async create(userId: string, input: CreateTripInput) {
    const trip = await this.repository.createTrip(userId, input);
    return serializeTrip(trip);
  }

  async listForUser(userId: string) {
    const trips = await this.repository.findManyTripsByUser(userId);
    return trips.map((trip) => serializeTrip(trip));
  }

  async getForUser(userId: string, tripId: string) {
    const trip = await this.access.requireOwnedTrip(userId, tripId, true);
    return serializeTrip(trip);
  }

  async updateForUser(userId: string, tripId: string, input: UpdateTripInput) {
    const trip = await this.access.requireOwnedTrip(userId, tripId, false);

    if (input.days !== undefined && input.days < trip.days) {
      const itineraryItemsBeyondNewDaysCount = await this.repository.countItineraryItemsBeyondDay(
        tripId,
        input.days,
      );
      if (itineraryItemsBeyondNewDaysCount > 0) {
        throw new BusinessException(
          `Cannot reduce days to ${input.days}: ${itineraryItemsBeyondNewDaysCount} itinerary item(s) still scheduled on a later day`,
          HttpStatus.CONFLICT,
        );
      }
    }

    const updatedTrip = await this.repository.updateTrip(tripId, input);
    return serializeTrip(updatedTrip);
  }

  async deleteForUser(userId: string, tripId: string): Promise<void> {
    await this.access.requireOwnedTrip(userId, tripId, false);
    await this.repository.deleteTrip(tripId);
  }
}
