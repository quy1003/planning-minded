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
  createItineraryItemSchema,
  createPlaceSchema,
  createTripSchema,
  reorderItinerarySchema,
  updateItineraryItemSchema,
  updatePlaceSchema,
  updateTripSchema,
  type CreateItineraryItemInput,
  type CreatePlaceInput,
  type CreateTripInput,
  type ReorderItineraryInput,
  type UpdateItineraryItemInput,
  type UpdatePlaceInput,
  type UpdateTripInput,
} from "@tripmind/shared";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUserId } from "../common/decorators/current-user-id.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { ItineraryService } from "./itinerary.service";
import { PlaceService } from "./place.service";
import { TripCrudService } from "./trip-crud.service";

@Controller("trips")
@UseGuards(JwtAuthGuard)
export class TripController {
  constructor(
    private readonly tripCrudService: TripCrudService,
    private readonly placeService: PlaceService,
    private readonly itineraryService: ItineraryService,
  ) {}

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

  // Places / itinerary routes trước `:tripId` — tránh Nest hiểu nhầm path.
  @Post(":tripId/places")
  @HttpCode(HttpStatus.CREATED)
  addPlace(
    @CurrentUserId() userId: string,
    @Param("tripId") tripId: string,
    @Body(new ZodValidationPipe(createPlaceSchema)) body: CreatePlaceInput,
  ) {
    return this.placeService.addPlace(userId, tripId, body);
  }

  @Get(":tripId/places")
  listPlaces(@CurrentUserId() userId: string, @Param("tripId") tripId: string) {
    return this.placeService.listPlaces(userId, tripId);
  }

  @Patch(":tripId/places/:placeId")
  updatePlace(
    @CurrentUserId() userId: string,
    @Param("tripId") tripId: string,
    @Param("placeId") placeId: string,
    @Body(new ZodValidationPipe(updatePlaceSchema)) body: UpdatePlaceInput,
  ) {
    return this.placeService.updatePlace(userId, tripId, placeId, body);
  }

  @Delete(":tripId/places/:placeId")
  @HttpCode(HttpStatus.NO_CONTENT)
  async removePlace(
    @CurrentUserId() userId: string,
    @Param("tripId") tripId: string,
    @Param("placeId") placeId: string,
  ): Promise<void> {
    await this.placeService.deletePlace(userId, tripId, placeId);
  }

  @Get(":tripId/itinerary")
  listItinerary(@CurrentUserId() userId: string, @Param("tripId") tripId: string) {
    return this.itineraryService.listItinerary(userId, tripId);
  }

  @Post(":tripId/itinerary")
  @HttpCode(HttpStatus.CREATED)
  addItineraryItem(
    @CurrentUserId() userId: string,
    @Param("tripId") tripId: string,
    @Body(new ZodValidationPipe(createItineraryItemSchema)) body: CreateItineraryItemInput,
  ) {
    return this.itineraryService.addItineraryItem(userId, tripId, body);
  }

  // `reorder` trước `:itemId` — tránh Nest coi "reorder" là itemId.
  @Patch(":tripId/itinerary/reorder")
  reorderItinerary(
    @CurrentUserId() userId: string,
    @Param("tripId") tripId: string,
    @Body(new ZodValidationPipe(reorderItinerarySchema)) body: ReorderItineraryInput,
  ) {
    return this.itineraryService.reorderItinerary(userId, tripId, body);
  }

  @Patch(":tripId/itinerary/:itemId")
  updateItineraryItem(
    @CurrentUserId() userId: string,
    @Param("tripId") tripId: string,
    @Param("itemId") itemId: string,
    @Body(new ZodValidationPipe(updateItineraryItemSchema)) body: UpdateItineraryItemInput,
  ) {
    return this.itineraryService.updateItineraryItem(userId, tripId, itemId, body);
  }

  @Delete(":tripId/itinerary/:itemId")
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeItineraryItem(
    @CurrentUserId() userId: string,
    @Param("tripId") tripId: string,
    @Param("itemId") itemId: string,
  ): Promise<void> {
    await this.itineraryService.deleteItineraryItem(userId, tripId, itemId);
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
