import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from "@nestjs/common";
import {
  createTripSchema,
  updateTripSchema,
  type CreateTripInput,
  type UpdateTripInput,
} from "@tripmind/shared";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { CurrentUserId } from "../../common/decorators/current-user-id.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { TripCrudService } from "./trip-crud.service";

@Controller("trips")
@UseGuards(JwtAuthGuard)
export class TripController {
  constructor(private readonly tripCrudService: TripCrudService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(createTripSchema)) body: CreateTripInput,
  ) {
    return this.tripCrudService.create(userId, body);
  }

  @Get()
  list(@CurrentUserId() userId: string) {
    return this.tripCrudService.listForUser(userId);
  }

  @Get(":tripId")
  getTrip(@CurrentUserId() userId: string, @Param("tripId") tripId: string) {
    return this.tripCrudService.getForUser(userId, tripId);
  }

  @Patch(":tripId")
  updateTrip(
    @CurrentUserId() userId: string,
    @Param("tripId") tripId: string,
    @Body(new ZodValidationPipe(updateTripSchema)) body: UpdateTripInput,
  ) {
    return this.tripCrudService.updateForUser(userId, tripId, body);
  }

  @Delete(":tripId")
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeTrip(@CurrentUserId() userId: string, @Param("tripId") tripId: string): Promise<void> {
    await this.tripCrudService.deleteForUser(userId, tripId);
  }
}
