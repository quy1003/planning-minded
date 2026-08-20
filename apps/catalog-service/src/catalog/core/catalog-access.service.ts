import { HttpStatus, Injectable } from "@nestjs/common";
import { BusinessException } from "../../common/exceptions/business.exception";
import { CatalogRepository } from "./catalog.repository";

/**
 * Check tồn tại (không phải "quyền sở hữu" — destinations/pois không thuộc về 1 user
 * cụ thể như trip, chỉ có "tồn tại hay không"), dùng chung cho DestinationService/PoiService.
 */
@Injectable()
export class CatalogAccessService {
  constructor(private readonly repository: CatalogRepository) {}

  async requireDestination(destinationId: string) {
    const destination = await this.repository.findDestination(destinationId);
    if (!destination) {
      throw new BusinessException("Destination not found", HttpStatus.NOT_FOUND);
    }
    return destination;
  }

  async requirePoi(destinationId: string, poiId: string) {
    const poi = await this.repository.findOwnedPoi(destinationId, poiId);
    if (!poi) {
      throw new BusinessException("Poi not found", HttpStatus.NOT_FOUND);
    }
    return poi;
  }
}
