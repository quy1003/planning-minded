import { HttpStatus, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type {
  CreateItineraryItemInput,
  ReorderItineraryInput,
  UpdateItineraryItemInput,
} from "@tripmind/shared";
import { BusinessException } from "../common/exceptions/business.exception";
import { serializeItineraryItem } from "./trip.serializer";
import { TripAccessService } from "./trip-access.service";
import { TripRepository } from "./trip.repository";

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

@Injectable()
export class ItineraryService {
  constructor(
    private readonly repository: TripRepository,
    private readonly access: TripAccessService,
  ) {}

  async listItinerary(userId: string, tripId: string) {
    await this.access.requireOwnedTrip(userId, tripId, false);
    const itineraryItems = await this.repository.findItineraryByTrip(tripId);
    return itineraryItems.map(serializeItineraryItem);
  }

  async addItineraryItem(userId: string, tripId: string, input: CreateItineraryItemInput) {
    const trip = await this.access.requireOwnedTrip(userId, tripId, false);
    this.assertDayInTrip(input.dayNumber, trip.days);
    await this.access.requireOwnedPlace(tripId, input.placeId);

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
    const trip = await this.access.requireOwnedTrip(userId, tripId, false);
    await this.access.requireOwnedItineraryItem(tripId, itemId);

    if (input.dayNumber !== undefined) {
      this.assertDayInTrip(input.dayNumber, trip.days);
    }
    if (input.placeId !== undefined) {
      await this.access.requireOwnedPlace(tripId, input.placeId);
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
    await this.access.requireOwnedTrip(userId, tripId, false);
    await this.access.requireOwnedItineraryItem(tripId, itemId);
    await this.repository.deleteItineraryItem(itemId);
  }

  async reorderItinerary(userId: string, tripId: string, moves: ReorderItineraryInput) {
    const trip = await this.access.requireOwnedTrip(userId, tripId, false);

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
}
