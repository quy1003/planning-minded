import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  createPlaceSchema,
  createTripSchema,
  updatePlaceSchema,
  updateTripSchema,
  type CreatePlaceInput,
  type CreateTripInput,
  type UpdatePlaceInput,
  type UpdateTripInput,
} from "@tripmind/shared";
import { SessionAuthGuard } from "../auth/guards/session-auth.guard";
import { CurrentUser, type AuthUser } from "../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { TripService } from "./trip.service";

@Controller("trips")
@UseGuards(SessionAuthGuard)
export class TripController {
  constructor(private readonly tripService: TripService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createTripSchema)) body: CreateTripInput,
  ) {
    return this.tripService.create(user.id, body);
  }

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.tripService.listForUser(user.id);
  }

  // Places routes trước `:id` — tránh Nest hiểu nhầm path.
  @Post(":tripId/places")
  @HttpCode(HttpStatus.CREATED)
  addPlace(
    @CurrentUser() user: AuthUser,
    @Param("tripId") tripId: string,
    @Body(new ZodValidationPipe(createPlaceSchema)) body: CreatePlaceInput,
  ) {
    return this.tripService.addPlace(user.id, tripId, body);
  }

  @Get(":tripId/places")
  listPlaces(@CurrentUser() user: AuthUser, @Param("tripId") tripId: string) {
    return this.tripService.listPlaces(user.id, tripId);
  }

  @Patch(":tripId/places/:placeId")
  updatePlace(
    @CurrentUser() user: AuthUser,
    @Param("tripId") tripId: string,
    @Param("placeId") placeId: string,
    @Body(new ZodValidationPipe(updatePlaceSchema)) body: UpdatePlaceInput,
  ) {
    return this.tripService.updatePlace(user.id, tripId, placeId, body);
  }

  @Delete(":tripId/places/:placeId")
  @HttpCode(HttpStatus.NO_CONTENT)
  async removePlace(
    @CurrentUser() user: AuthUser,
    @Param("tripId") tripId: string,
    @Param("placeId") placeId: string,
  ): Promise<void> {
    await this.tripService.deletePlace(user.id, tripId, placeId);
  }

  @Get(":id")
  get(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.tripService.getForUser(user.id, id);
  }

  @Patch(":id")
  update(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateTripSchema)) body: UpdateTripInput,
  ) {
    return this.tripService.updateForUser(user.id, id, body);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentUser() user: AuthUser, @Param("id") id: string): Promise<void> {
    await this.tripService.deleteForUser(user.id, id);
  }
}
