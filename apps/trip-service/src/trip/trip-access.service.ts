import { HttpStatus, Injectable } from "@nestjs/common";
import { BusinessException } from "../common/exceptions/business.exception";
import { TripRepository } from "./trip.repository";

/**
 * Check quyền sở hữu (trip/place/itineraryItem thuộc đúng user/trip), dùng chung cho
 * TripCrudService, PlaceService, ItineraryService — tránh copy-paste 3 lần cùng 1 logic.
 * Không phải sub-domain — không có route/controller nào gọi thẳng vào đây.
 */
@Injectable()
export class TripAccessService {
  constructor(private readonly repository: TripRepository) {}

  async requireOwnedTrip(userId: string, tripId: string, includePlaces: boolean) {
    const trip = await this.repository.findOwnedTrip(userId, tripId, includePlaces);
    if (!trip) {
      throw new BusinessException("Trip not found", HttpStatus.NOT_FOUND);
    }
    return trip;
  }

  async requireOwnedPlace(tripId: string, placeId: string) {
    const place = await this.repository.findOwnedPlace(tripId, placeId);
    if (!place) {
      throw new BusinessException("Place not found", HttpStatus.NOT_FOUND);
    }
    return place;
  }

  async requireOwnedItineraryItem(tripId: string, itemId: string) {
    const itineraryItem = await this.repository.findOwnedItineraryItem(tripId, itemId);
    if (!itineraryItem) {
      throw new BusinessException("Itinerary item not found", HttpStatus.NOT_FOUND);
    }
    return itineraryItem;
  }
}
