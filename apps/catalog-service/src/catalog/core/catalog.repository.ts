import { Injectable } from "@nestjs/common";
import { Prisma } from "../../generated/prisma-client";
import type {
  CreateDestinationInput,
  CreatePoiInput,
  ListDestinationsQuery,
  UpdateDestinationInput,
  UpdatePoiInput,
} from "@tripmind/shared";
import { PrismaService } from "../../prisma/prisma.service";

/**
 * Chỉ query/ghi DB thô — trả `null` nếu không thấy, không ném exception (giống
 * TripRepository ở trip-service). Service chịu trách nhiệm diễn giải thành lỗi nghiệp vụ.
 */
@Injectable()
export class CatalogRepository {
  constructor(private readonly prisma: PrismaService) {}

  createDestination(input: CreateDestinationInput) {
    return this.prisma.destination.create({
      data: {
        name: input.name,
        region: input.region,
        description: input.description,
        lat: new Prisma.Decimal(input.lat),
        lng: new Prisma.Decimal(input.lng),
        bestSeasons: input.bestSeasons ?? [],
        tags: input.tags ?? [],
      },
    });
  }

  findManyDestinations(query: ListDestinationsQuery) {
    const tags = query.tags?.split(",").map((tag) => tag.trim()).filter(Boolean);
    return this.prisma.destination.findMany({
      where: {
        region: query.region,
        tags: tags && tags.length > 0 ? { hasSome: tags } : undefined,
      },
      orderBy: { name: "asc" },
    });
  }

  findDestination(destinationId: string) {
    return this.prisma.destination.findUnique({ where: { id: destinationId } });
  }

  updateDestination(destinationId: string, input: UpdateDestinationInput) {
    const data: Prisma.DestinationUpdateInput = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.region !== undefined) data.region = input.region;
    if (input.description !== undefined) data.description = input.description;
    if (input.lat !== undefined) data.lat = new Prisma.Decimal(input.lat);
    if (input.lng !== undefined) data.lng = new Prisma.Decimal(input.lng);
    if (input.bestSeasons !== undefined) data.bestSeasons = input.bestSeasons;
    if (input.tags !== undefined) data.tags = input.tags;

    return this.prisma.destination.update({ where: { id: destinationId }, data });
  }

  /** Không catch P2003 ở đây — service quyết định lỗi đó nghĩa là gì với người dùng. */
  async deleteDestination(destinationId: string): Promise<void> {
    await this.prisma.destination.delete({ where: { id: destinationId } });
  }

  createPoi(destinationId: string, input: CreatePoiInput) {
    return this.prisma.poi.create({
      data: {
        destinationId,
        name: input.name,
        address: input.address ?? null,
        lat: new Prisma.Decimal(input.lat),
        lng: new Prisma.Decimal(input.lng),
        category: input.category,
        description: input.description,
        estCostMin: new Prisma.Decimal(input.estCostMin),
        estCostMax: new Prisma.Decimal(input.estCostMax),
        avgDurationMin: input.avgDurationMin,
        openingHours: input.openingHours ?? Prisma.JsonNull,
        tags: input.tags ?? [],
        kidFriendly: input.kidFriendly ?? false,
      },
    });
  }

  findPoisByDestination(destinationId: string) {
    return this.prisma.poi.findMany({
      where: { destinationId },
      orderBy: { name: "asc" },
    });
  }

  findOwnedPoi(destinationId: string, poiId: string) {
    return this.prisma.poi.findFirst({ where: { id: poiId, destinationId } });
  }

  updatePoi(poiId: string, input: UpdatePoiInput) {
    const data: Prisma.PoiUpdateInput = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.address !== undefined) data.address = input.address;
    if (input.lat !== undefined) data.lat = new Prisma.Decimal(input.lat);
    if (input.lng !== undefined) data.lng = new Prisma.Decimal(input.lng);
    if (input.category !== undefined) data.category = input.category;
    if (input.description !== undefined) data.description = input.description;
    if (input.estCostMin !== undefined) data.estCostMin = new Prisma.Decimal(input.estCostMin);
    if (input.estCostMax !== undefined) data.estCostMax = new Prisma.Decimal(input.estCostMax);
    if (input.avgDurationMin !== undefined) data.avgDurationMin = input.avgDurationMin;
    if (input.openingHours !== undefined) data.openingHours = input.openingHours ?? Prisma.JsonNull;
    if (input.tags !== undefined) data.tags = input.tags;
    if (input.kidFriendly !== undefined) data.kidFriendly = input.kidFriendly;

    return this.prisma.poi.update({ where: { id: poiId }, data });
  }

  async deletePoi(poiId: string): Promise<void> {
    await this.prisma.poi.delete({ where: { id: poiId } });
  }
}
