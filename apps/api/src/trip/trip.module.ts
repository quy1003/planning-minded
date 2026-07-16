import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { TripController } from "./trip.controller";
import { TripRepository } from "./trip.repository";
import { TripService } from "./trip.service";

@Module({
  imports: [AuthModule],
  controllers: [TripController],
  providers: [TripService, TripRepository],
  exports: [TripService],
})
export class TripModule {}
