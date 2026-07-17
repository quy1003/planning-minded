import { HttpStatus, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type {
  CreateItineraryItemInput,
  DaySlot,
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

    this.assertChronologicalOrder(existingItineraryItems, moves);

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

  /**
   * Trong cùng (dayNumber, slot): các item CÓ startTime, sắp theo visitOrder cuối cùng, giờ phải
   * tăng dần — không cho kéo mục giờ trễ hơn lên trước mục giờ sớm hơn. Item không có startTime
   * thì không bị ràng buộc gì (có thể đứng ở đâu cũng được).
   */
  private assertChronologicalOrder(
    existingItineraryItems: Array<{
      id: string;
      dayNumber: number;
      slot: DaySlot;
      visitOrder: number;
      startTime: Date | null;
    }>,
    moves: ReorderItineraryInput,
  ): void {
    const finalPositionById = new Map(
      existingItineraryItems.map((item) => [
        item.id,
        { dayNumber: item.dayNumber, slot: item.slot, visitOrder: item.visitOrder, startTime: item.startTime },
      ]),
    );
    for (const move of moves) {
      const current = finalPositionById.get(move.itemId);
      if (!current) continue;
      finalPositionById.set(move.itemId, { ...current, dayNumber: move.dayNumber, slot: move.slot, visitOrder: move.visitOrder });
    }

    const groups = new Map<string, Array<{ visitOrder: number; startTime: Date | null }>>();
    for (const position of finalPositionById.values()) {
      const key = `${position.dayNumber}:${position.slot}`;
      const group = groups.get(key) ?? [];
      group.push(position);
      groups.set(key, group);
    }

    for (const [key, group] of groups) {
      const timedInOrder = group
        .filter((position) => position.startTime)
        .sort((a, b) => a.visitOrder - b.visitOrder);
      for (let i = 1; i < timedInOrder.length; i++) {
        const previous = timedInOrder[i - 1]!;
        const current = timedInOrder[i]!;
        if (current.startTime!.getTime() < previous.startTime!.getTime()) {
          const [dayNumber, slot] = key.split(":");
          throw new BusinessException(
            `Reorder vi phạm thứ tự thời gian (ngày ${dayNumber}, buổi ${slot})`,
            HttpStatus.UNPROCESSABLE_ENTITY,
          );
        }
      }
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
