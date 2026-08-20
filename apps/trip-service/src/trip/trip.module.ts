import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { ItineraryController } from "./itinerary/itinerary.controller";
import { ItineraryService } from "./itinerary/itinerary.service";
import { PlaceController } from "./place/place.controller";
import { PlaceService } from "./place/place.service";
import { TripAccessService } from "./core/trip-access.service";
import { TripRepository } from "./core/trip.repository";
import { TripController } from "./trip/trip.controller";
import { TripCrudService } from "./trip/trip-crud.service";

@Module({
  imports: [AuthModule],
  controllers: [TripController, PlaceController, ItineraryController],
  providers: [TripRepository, TripAccessService, TripCrudService, PlaceService, ItineraryService],
})
export class TripModule {}
