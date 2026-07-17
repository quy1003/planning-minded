import { Injectable } from "@nestjs/common";
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
import { PrismaService } from "../prisma/prisma.service";

/** Parse "HH:mm" / "HH:mm:ss" → Date dùng cho Prisma @db.Time. */
function parseTimeOfDay(value: string): Date {
  const normalized = value.length === 5 ? `${value}:00` : value;
  return new Date(`1970-01-01T${normalized}.000Z`);
}

/**
 * Chỉ query/ghi DB thô — không biết "quyền sở hữu" nghĩa là gì (trả `null` nếu không thấy),
 * không ném BusinessException. TripService chịu trách nhiệm diễn giải kết quả thành lỗi nghiệp vụ.
 */
@Injectable()
export class TripRepository {
  constructor(private readonly prisma: PrismaService) {}

  createTrip(userId: string, input: CreateTripInput) {
    return this.prisma.trip.create({
      data: {
        userId,
        title: input.title,
        destinationName: input.destinationName,
        startDate: input.startDate ? new Date(input.startDate) : null,
        days: input.days,
        partySize: input.partySize,
        budget: new Prisma.Decimal(input.budget),
        currency: input.currency,
        status: input.status ?? "DRAFT",
      },
    });
  }

  findManyTripsByUser(userId: string) {
    return this.prisma.trip.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });
  }

  findOwnedTrip(userId: string, tripId: string, includePlaces: boolean) {
    return this.prisma.trip.findFirst({
      where: { id: tripId, userId },
      include: includePlaces ? { places: true } : undefined,
    });
  }

  updateTrip(tripId: string, input: UpdateTripInput) {
    const data: Prisma.TripUpdateInput = {};
    if (input.title !== undefined) data.title = input.title;
    if (input.destinationName !== undefined) data.destinationName = input.destinationName;
    if (input.startDate !== undefined) {
      data.startDate = input.startDate === null ? null : new Date(input.startDate);
    }
    if (input.days !== undefined) data.days = input.days;
    if (input.partySize !== undefined) data.partySize = input.partySize;
    if (input.budget !== undefined) data.budget = new Prisma.Decimal(input.budget);
    if (input.currency !== undefined) data.currency = input.currency;
    if (input.status !== undefined) data.status = input.status;

    return this.prisma.trip.update({ where: { id: tripId }, data });
  }

  async deleteTrip(tripId: string): Promise<void> {
    await this.prisma.trip.delete({ where: { id: tripId } });
  }

  createPlace(tripId: string, input: CreatePlaceInput) {
    return this.prisma.place.create({
      data: {
        tripId,
        name: input.name,
        address: input.address ?? null,
        lat: new Prisma.Decimal(input.lat),
        lng: new Prisma.Decimal(input.lng),
        catalogPlaceId: input.catalogPlaceId ?? null,
      },
    });
  }

  findPlacesByTrip(tripId: string) {
    return this.prisma.place.findMany({
      where: { tripId },
      orderBy: { createdAt: "asc" },
    });
  }

  findOwnedPlace(tripId: string, placeId: string) {
    return this.prisma.place.findFirst({ where: { id: placeId, tripId } });
  }

  updatePlace(placeId: string, input: UpdatePlaceInput) {
    const data: Prisma.PlaceUpdateInput = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.address !== undefined) data.address = input.address;
    if (input.lat !== undefined) data.lat = new Prisma.Decimal(input.lat);
    if (input.lng !== undefined) data.lng = new Prisma.Decimal(input.lng);
    if (input.catalogPlaceId !== undefined) data.catalogPlaceId = input.catalogPlaceId;

    return this.prisma.place.update({ where: { id: placeId }, data });
  }

  /** Không catch P2003 ở đây — service quyết định lỗi đó nghĩa là gì với người dùng. */
  async deletePlace(placeId: string): Promise<void> {
    await this.prisma.place.delete({ where: { id: placeId } });
  }

  findItineraryByTrip(tripId: string) {
    return this.prisma.itineraryItem.findMany({
      where: { tripId },
      include: { place: true },
      orderBy: [{ dayNumber: "asc" }, { slot: "asc" }, { visitOrder: "asc" }],
    });
  }

  /** Chỉ lấy field cần cho reorder pre-flight check (không cần include place). */
  findItineraryMetaByTrip(tripId: string) {
    return this.prisma.itineraryItem.findMany({
      where: { tripId },
      select: { id: true, dayNumber: true, slot: true, visitOrder: true, startTime: true },
    });
  }

  /** Đếm itinerary item có dayNumber lớn hơn `day` — dùng khi muốn giảm `trip.days`. */
  countItineraryItemsBeyondDay(tripId: string, day: number) {
    return this.prisma.itineraryItem.count({
      where: { tripId, dayNumber: { gt: day } },
    });
  }

  createItineraryItem(tripId: string, input: CreateItineraryItemInput) {
    return this.prisma.itineraryItem.create({
      data: {
        tripId,
        placeId: input.placeId,
        dayNumber: input.dayNumber,
        slot: input.slot,
        visitOrder: input.visitOrder,
        title: input.title,
        description: input.description ?? null,
        startTime: input.startTime ? parseTimeOfDay(input.startTime) : null,
        endTime: input.endTime ? parseTimeOfDay(input.endTime) : null,
        durationMin: input.durationMin ?? null,
        estCost: new Prisma.Decimal(input.estCost ?? 0),
      },
      include: { place: true },
    });
  }

  findOwnedItineraryItem(tripId: string, itemId: string) {
    return this.prisma.itineraryItem.findFirst({ where: { id: itemId, tripId } });
  }

  updateItineraryItem(itemId: string, input: UpdateItineraryItemInput) {
    const data: Prisma.ItineraryItemUpdateInput = {};
    if (input.placeId !== undefined) data.place = { connect: { id: input.placeId } };
    if (input.dayNumber !== undefined) data.dayNumber = input.dayNumber;
    if (input.slot !== undefined) data.slot = input.slot;
    if (input.visitOrder !== undefined) data.visitOrder = input.visitOrder;
    if (input.title !== undefined) data.title = input.title;
    if (input.description !== undefined) data.description = input.description;
    if (input.startTime !== undefined) {
      data.startTime = input.startTime === null ? null : parseTimeOfDay(input.startTime);
    }
    if (input.endTime !== undefined) {
      data.endTime = input.endTime === null ? null : parseTimeOfDay(input.endTime);
    }
    if (input.durationMin !== undefined) data.durationMin = input.durationMin;
    if (input.estCost !== undefined) data.estCost = new Prisma.Decimal(input.estCost);

    return this.prisma.itineraryItem.update({
      where: { id: itemId },
      data,
      include: { place: true },
    });
  }

  async deleteItineraryItem(itemId: string): Promise<void> {
    await this.prisma.itineraryItem.delete({ where: { id: itemId } });
  }

  /**
   * Đổi thứ tự nhiều item atomic: gán visitOrder tạm số âm (tránh đụng UNIQUE giữa chừng),
   * rồi gán giá trị cuối. Chi tiết "sao phải làm 2 pha" là chuyện của Prisma/unique constraint,
   * không phải quy tắc nghiệp vụ — nên nằm ở repository.
   */
  reorderTransaction(tripId: string, moves: ReorderItineraryInput) {
    return this.prisma.$transaction(async (tx) => {
      for (const [index, move] of moves.entries()) {
        await tx.itineraryItem.update({
          where: { id: move.itemId },
          data: { visitOrder: -(index + 1) },
        });
      }

      for (const move of moves) {
        await tx.itineraryItem.update({
          where: { id: move.itemId },
          data: {
            dayNumber: move.dayNumber,
            slot: move.slot,
            visitOrder: move.visitOrder,
          },
        });
      }

      return tx.itineraryItem.findMany({
        where: { tripId },
        include: { place: true },
        orderBy: [{ dayNumber: "asc" }, { slot: "asc" }, { visitOrder: "asc" }],
      });
    });
  }
}
