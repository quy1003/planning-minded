import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { ItineraryService } from "./itinerary.service";
import { PlaceService } from "./place.service";
import { TripAccessService } from "./trip-access.service";
import { TripController } from "./trip.controller";
import { TripCrudService } from "./trip-crud.service";
import { TripRepository } from "./trip.repository";

@Module({
  imports: [AuthModule],
  controllers: [TripController],
  providers: [TripRepository, TripAccessService, TripCrudService, PlaceService, ItineraryService],
})
export class TripModule {}
