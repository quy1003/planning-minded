import { HttpStatus, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { CreatePlaceInput, CreateTripInput, UpdatePlaceInput, UpdateTripInput } from "@tripmind/shared";
import { BusinessException } from "../common/exceptions/business.exception";
import { PrismaService } from "../prisma/prisma.service";
import { serializePlace, serializeTrip } from "./trip.serializer";

@Injectable()
export class TripService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, input: CreateTripInput) {
    const trip = await this.prisma.trip.create({
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
    return serializeTrip(trip);
  }

  async listForUser(userId: string) {
    const trips = await this.prisma.trip.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });
    return trips.map((t) => serializeTrip(t));
  }

  async getForUser(userId: string, tripId: string) {
    const trip = await this.requireOwnedTrip(userId, tripId, true);
    return serializeTrip(trip);
  }

  async updateForUser(userId: string, tripId: string, input: UpdateTripInput) {
    await this.requireOwnedTrip(userId, tripId, false);

    const data: Prisma.TripUpdateInput = {};
    if (input.title !== undefined) data.title = input.title;
    if (input.destinationName !== undefined) data.destinationName = input.destinationName;
    if (input.startDate !== undefined) data.startDate = new Date(input.startDate);
    if (input.days !== undefined) data.days = input.days;
    if (input.partySize !== undefined) data.partySize = input.partySize;
    if (input.budget !== undefined) data.budget = new Prisma.Decimal(input.budget);
    if (input.currency !== undefined) data.currency = input.currency;
    if (input.status !== undefined) data.status = input.status;

    const trip = await this.prisma.trip.update({ where: { id: tripId }, data });
    return serializeTrip(trip);
  }

  async deleteForUser(userId: string, tripId: string): Promise<void> {
    await this.requireOwnedTrip(userId, tripId, false);
    await this.prisma.trip.delete({ where: { id: tripId } });
  }

  async addPlace(userId: string, tripId: string, input: CreatePlaceInput) {
    await this.requireOwnedTrip(userId, tripId, false);
    const place = await this.prisma.place.create({
      data: {
        tripId,
        name: input.name,
        address: input.address ?? null,
        lat: new Prisma.Decimal(input.lat),
        lng: new Prisma.Decimal(input.lng),
        catalogPlaceId: input.catalogPlaceId ?? null,
      },
    });
    return serializePlace(place);
  }

  async listPlaces(userId: string, tripId: string) {
    await this.requireOwnedTrip(userId, tripId, false);
    const places = await this.prisma.place.findMany({
      where: { tripId },
      orderBy: { createdAt: "asc" },
    });
    return places.map(serializePlace);
  }

  async updatePlace(userId: string, tripId: string, placeId: string, input: UpdatePlaceInput) {
    await this.requireOwnedPlace(userId, tripId, placeId);

    const data: Prisma.PlaceUpdateInput = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.address !== undefined) data.address = input.address;
    if (input.lat !== undefined) data.lat = new Prisma.Decimal(input.lat);
    if (input.lng !== undefined) data.lng = new Prisma.Decimal(input.lng);
    if (input.catalogPlaceId !== undefined) data.catalogPlaceId = input.catalogPlaceId;

    const place = await this.prisma.place.update({ where: { id: placeId }, data });
    return serializePlace(place);
  }

  async deletePlace(userId: string, tripId: string, placeId: string): Promise<void> {
    await this.requireOwnedPlace(userId, tripId, placeId);
    try {
      await this.prisma.place.delete({ where: { id: placeId } });
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

  private async requireOwnedTrip(userId: string, tripId: string, includePlaces: boolean) {
    const trip = await this.prisma.trip.findFirst({
      where: { id: tripId, userId },
      include: includePlaces ? { places: true } : undefined,
    });
    if (!trip) {
      throw new BusinessException("Trip not found", HttpStatus.NOT_FOUND);
    }
    return trip;
  }

  private async requireOwnedPlace(userId: string, tripId: string, placeId: string) {
    await this.requireOwnedTrip(userId, tripId, false);
    const place = await this.prisma.place.findFirst({
      where: { id: placeId, tripId },
    });
    if (!place) {
      throw new BusinessException("Place not found", HttpStatus.NOT_FOUND);
    }
    return place;
  }
}
