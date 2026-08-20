import { HttpStatus, Injectable } from "@nestjs/common";
import { Prisma } from "../../generated/prisma-client";
import type { CreatePoiInput, UpdatePoiInput } from "@tripmind/shared";
import { BusinessException } from "../../common/exceptions/business.exception";
import { CatalogAccessService } from "../core/catalog-access.service";
import { serializePoi } from "../core/catalog.serializer";
import { CatalogRepository } from "../core/catalog.repository";

@Injectable()
export class PoiService {
  constructor(
    private readonly repository: CatalogRepository,
    private readonly access: CatalogAccessService,
  ) {}

  async create(destinationId: string, input: CreatePoiInput) {
    await this.access.requireDestination(destinationId);
    try {
      const poi = await this.repository.createPoi(destinationId, input);
      return serializePoi(poi);
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new BusinessException("Poi name already exists in this destination", HttpStatus.CONFLICT);
      }
      throw error;
    }
  }

  async list(destinationId: string) {
    await this.access.requireDestination(destinationId);
    const pois = await this.repository.findPoisByDestination(destinationId);
    return pois.map(serializePoi);
  }

  async update(destinationId: string, poiId: string, input: UpdatePoiInput) {
    await this.access.requireDestination(destinationId);
    await this.access.requirePoi(destinationId, poiId);
    try {
      const poi = await this.repository.updatePoi(poiId, input);
      return serializePoi(poi);
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new BusinessException("Poi name already exists in this destination", HttpStatus.CONFLICT);
      }
      throw error;
    }
  }

  async delete(destinationId: string, poiId: string): Promise<void> {
    await this.access.requireDestination(destinationId);
    await this.access.requirePoi(destinationId, poiId);
    await this.repository.deletePoi(poiId);
  }
}
