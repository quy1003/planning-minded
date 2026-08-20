import { HttpStatus, Injectable } from "@nestjs/common";
import { Prisma } from "../generated/prisma-client";
import type { CreateDestinationInput, ListDestinationsQuery, UpdateDestinationInput } from "@tripmind/shared";
import { BusinessException } from "../common/exceptions/business.exception";
import { CatalogAccessService } from "./catalog-access.service";
import { serializeDestination } from "./catalog.serializer";
import { CatalogRepository } from "./catalog.repository";

@Injectable()
export class DestinationService {
  constructor(
    private readonly repository: CatalogRepository,
    private readonly access: CatalogAccessService,
  ) {}

  async create(input: CreateDestinationInput) {
    try {
      const destination = await this.repository.createDestination(input);
      return serializeDestination(destination);
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new BusinessException("Destination name already exists", HttpStatus.CONFLICT);
      }
      throw error;
    }
  }

  async list(query: ListDestinationsQuery) {
    const destinations = await this.repository.findManyDestinations(query);
    return destinations.map(serializeDestination);
  }

  async get(destinationId: string) {
    const destination = await this.access.requireDestination(destinationId);
    return serializeDestination(destination);
  }

  async update(destinationId: string, input: UpdateDestinationInput) {
    await this.access.requireDestination(destinationId);
    try {
      const destination = await this.repository.updateDestination(destinationId, input);
      return serializeDestination(destination);
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new BusinessException("Destination name already exists", HttpStatus.CONFLICT);
      }
      throw error;
    }
  }

  async delete(destinationId: string): Promise<void> {
    await this.access.requireDestination(destinationId);
    try {
      await this.repository.deleteDestination(destinationId);
    } catch (error: unknown) {
      // Restrict/Cascade: theo schema là Cascade (xóa destination xóa luôn pois) — P2003
      // không nên xảy ra thật, nhưng giữ lại phòng khi đổi onDelete sau này.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
        throw new BusinessException("Destination is still referenced elsewhere", HttpStatus.CONFLICT);
      }
      throw error;
    }
  }
}
