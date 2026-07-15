import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { TripController } from "./trip.controller";
import { TripService } from "./trip.service";

@Module({
  imports: [AuthModule],
  controllers: [TripController],
  providers: [TripService],
  exports: [TripService],
})
export class TripModule {}
