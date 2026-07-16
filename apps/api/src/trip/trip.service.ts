import { HttpStatus, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type {
  CreateItineraryItemInput,
  CreatePlaceInput,
  CreateTripInput,
  ReorderItineraryInput,
  UpdateItineraryItemInput,
  UpdatePlaceInput,
  UpdateTripInput,
} from "@tripmind/shared";
import { BusinessException } from "../common/exceptions/business.exception";
import { serializeItineraryItem, serializePlace, serializeTrip } from "./trip.serializer";
import { TripRepository } from "./trip.repository";

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

@Injectable()
export class TripService {
  constructor(private readonly repository: TripRepository) {}

  async create(userId: string, input: CreateTripInput) {
    const trip = await this.repository.createTrip(userId, input);
    return serializeTrip(trip);
  }

  async listForUser(userId: string) {
    const trips = await this.repository.findManyTripsByUser(userId);
    return trips.map((trip) => serializeTrip(trip));
  }

  async getForUser(userId: string, tripId: string) {
    const trip = await this.requireOwnedTrip(userId, tripId, true);
    return serializeTrip(trip);
  }

  async updateForUser(userId: string, tripId: string, input: UpdateTripInput) {
    const trip = await this.requireOwnedTrip(userId, tripId, false);

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
    await this.requireOwnedTrip(userId, tripId, false);
    await this.repository.deleteTrip(tripId);
  }

  async addPlace(userId: string, tripId: string, input: CreatePlaceInput) {
    await this.requireOwnedTrip(userId, tripId, false);
    const place = await this.repository.createPlace(tripId, input);
    return serializePlace(place);
  }

  async listPlaces(userId: string, tripId: string) {
    await this.requireOwnedTrip(userId, tripId, false);
    const places = await this.repository.findPlacesByTrip(tripId);
    return places.map(serializePlace);
  }

  async updatePlace(userId: string, tripId: string, placeId: string, input: UpdatePlaceInput) {
    await this.requireOwnedTrip(userId, tripId, false);
    await this.requireOwnedPlace(tripId, placeId);

    const place = await this.repository.updatePlace(placeId, input);
    return serializePlace(place);
  }

  async deletePlace(userId: string, tripId: string, placeId: string): Promise<void> {
    await this.requireOwnedTrip(userId, tripId, false);
    await this.requireOwnedPlace(tripId, placeId);
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

  async listItinerary(userId: string, tripId: string) {
    await this.requireOwnedTrip(userId, tripId, false);
    const itineraryItems = await this.repository.findItineraryByTrip(tripId);
    return itineraryItems.map(serializeItineraryItem);
  }

  async addItineraryItem(userId: string, tripId: string, input: CreateItineraryItemInput) {
    const trip = await this.requireOwnedTrip(userId, tripId, false);
    this.assertDayInTrip(input.dayNumber, trip.days);
    await this.requireOwnedPlace(tripId, input.placeId);

    try {
      const itineraryItem = await this.repository.createItineraryItem(tripId, input);
      return serializeItineraryItem(itineraryItem);
    } catch (error: unknown) {
      if (isUniqueViolation(error)) {
        throw new BusinessException(
          "Itinerary slot order already taken for this day/slot",
          HttpStatus.CONFLICT,
        );
      }
      throw error;
    }
  }

  async updateItineraryItem(
    userId: string,
    tripId: string,
    itemId: string,
    input: UpdateItineraryItemInput,
  ) {
    const trip = await this.requireOwnedTrip(userId, tripId, false);
    await this.requireOwnedItineraryItem(tripId, itemId);

    if (input.dayNumber !== undefined) {
      this.assertDayInTrip(input.dayNumber, trip.days);
    }
    if (input.placeId !== undefined) {
      await this.requireOwnedPlace(tripId, input.placeId);
    }

    try {
      const itineraryItem = await this.repository.updateItineraryItem(itemId, input);
      return serializeItineraryItem(itineraryItem);
    } catch (error: unknown) {
      if (isUniqueViolation(error)) {
        throw new BusinessException(
          "Itinerary slot order already taken for this day/slot",
          HttpStatus.CONFLICT,
        );
      }
      throw error;
    }
  }

  async deleteItineraryItem(userId: string, tripId: string, itemId: string): Promise<void> {
    await this.requireOwnedTrip(userId, tripId, false);
    await this.requireOwnedItineraryItem(tripId, itemId);
    await this.repository.deleteItineraryItem(itemId);
  }

  async reorderItinerary(userId: string, tripId: string, moves: ReorderItineraryInput) {
    const trip = await this.requireOwnedTrip(userId, tripId, false);

    const existingItineraryItems = await this.repository.findItineraryMetaByTrip(tripId);
    const existingItineraryItemIds = new Set(
      existingItineraryItems.map((existingItineraryItem) => existingItineraryItem.id),
    );

    // Check: tất cả itemId trong moves đều tồn tại và dayNumber hợp lệ
    for (const move of moves) {
      if (!existingItineraryItemIds.has(move.itemId)) {
        throw new BusinessException("Itinerary item not found", HttpStatus.NOT_FOUND);
      }
      this.assertDayInTrip(move.dayNumber, trip.days);
    }

    // Pre-flight: itinerary item KHÔNG nằm trong danh sách moves vẫn giữ nguyên vị trí — nếu vị trí
    // đích của 1 move trùng vị trí hiện tại của item đó, chặn sớm thay vì để DB ném lỗi thô.
    const movedItineraryItemIds = new Set(moves.map((move) => move.itemId));
    const targetPositionKeys = new Set(
      moves.map((move) => `${move.dayNumber}:${move.slot}:${move.visitOrder}`),
    );

    // Check: tất cả itemId trong moves đều hợp lệ, và không có move nào trùng vị trí với item ngoài moves
    for (const existingItineraryItem of existingItineraryItems) {
      if (movedItineraryItemIds.has(existingItineraryItem.id)) continue;
      const currentPositionKey = `${existingItineraryItem.dayNumber}:${existingItineraryItem.slot}:${existingItineraryItem.visitOrder}`;
      if (targetPositionKeys.has(currentPositionKey)) {
        throw new BusinessException(
          "Itinerary slot order already taken by an item outside this reorder batch",
          HttpStatus.CONFLICT,
        );
      }
    }

    try {
      const reorderedItineraryItems = await this.repository.reorderTransaction(tripId, moves);
      return reorderedItineraryItems.map(serializeItineraryItem);
    } catch (error: unknown) {
      if (isUniqueViolation(error)) {
        throw new BusinessException(
          "Itinerary slot order already taken for this day/slot",
          HttpStatus.CONFLICT,
        );
      }
      throw error;
    }
  }

  private assertDayInTrip(dayNumber: number, tripDays: number): void {
    if (dayNumber < 1 || dayNumber > tripDays) {
      throw new BusinessException(
        `dayNumber must be between 1 and ${tripDays}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private async requireOwnedTrip(userId: string, tripId: string, includePlaces: boolean) {
    const trip = await this.repository.findOwnedTrip(userId, tripId, includePlaces);
    if (!trip) {
      throw new BusinessException("Trip not found", HttpStatus.NOT_FOUND);
    }
    return trip;
  }

  private async requireOwnedPlace(tripId: string, placeId: string) {
    const place = await this.repository.findOwnedPlace(tripId, placeId);
    if (!place) {
      throw new BusinessException("Place not found", HttpStatus.NOT_FOUND);
    }
    return place;
  }

  private async requireOwnedItineraryItem(tripId: string, itemId: string) {
    const itineraryItem = await this.repository.findOwnedItineraryItem(tripId, itemId);
    if (!itineraryItem) {
      throw new BusinessException("Itinerary item not found", HttpStatus.NOT_FOUND);
    }
    return itineraryItem;
  }
}
