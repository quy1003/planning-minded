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
import { SessionAuthGuard } from "../auth/guards/session-auth.guard";
import { CurrentUser, type AuthUser } from "../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { ItineraryService } from "./itinerary.service";
import { PlaceService } from "./place.service";
import { TripCrudService } from "./trip-crud.service";

@Controller("trips")
@UseGuards(SessionAuthGuard)
export class TripController {
  constructor(
    private readonly tripCrudService: TripCrudService,
    private readonly placeService: PlaceService,
    private readonly itineraryService: ItineraryService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createTripSchema)) body: CreateTripInput,
  ) {
    return this.tripCrudService.create(user.id, body);
  }

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.tripCrudService.listForUser(user.id);
  }

  // Places / itinerary routes trước `:tripId` — tránh Nest hiểu nhầm path.
  @Post(":tripId/places")
  @HttpCode(HttpStatus.CREATED)
  addPlace(
    @CurrentUser() user: AuthUser,
    @Param("tripId") tripId: string,
    @Body(new ZodValidationPipe(createPlaceSchema)) body: CreatePlaceInput,
  ) {
    return this.placeService.addPlace(user.id, tripId, body);
  }

  @Get(":tripId/places")
  listPlaces(@CurrentUser() user: AuthUser, @Param("tripId") tripId: string) {
    return this.placeService.listPlaces(user.id, tripId);
  }

  @Patch(":tripId/places/:placeId")
  updatePlace(
    @CurrentUser() user: AuthUser,
    @Param("tripId") tripId: string,
    @Param("placeId") placeId: string,
    @Body(new ZodValidationPipe(updatePlaceSchema)) body: UpdatePlaceInput,
  ) {
    return this.placeService.updatePlace(user.id, tripId, placeId, body);
  }

  @Delete(":tripId/places/:placeId")
  @HttpCode(HttpStatus.NO_CONTENT)
  async removePlace(
    @CurrentUser() user: AuthUser,
    @Param("tripId") tripId: string,
    @Param("placeId") placeId: string,
  ): Promise<void> {
    await this.placeService.deletePlace(user.id, tripId, placeId);
  }

  @Get(":tripId/itinerary")
  listItinerary(@CurrentUser() user: AuthUser, @Param("tripId") tripId: string) {
    return this.itineraryService.listItinerary(user.id, tripId);
  }

  @Post(":tripId/itinerary")
  @HttpCode(HttpStatus.CREATED)
  addItineraryItem(
    @CurrentUser() user: AuthUser,
    @Param("tripId") tripId: string,
    @Body(new ZodValidationPipe(createItineraryItemSchema)) body: CreateItineraryItemInput,
  ) {
    return this.itineraryService.addItineraryItem(user.id, tripId, body);
  }

  // `reorder` trước `:itemId` — tránh Nest coi "reorder" là itemId.
  @Patch(":tripId/itinerary/reorder")
  reorderItinerary(
    @CurrentUser() user: AuthUser,
    @Param("tripId") tripId: string,
    @Body(new ZodValidationPipe(reorderItinerarySchema)) body: ReorderItineraryInput,
  ) {
    return this.itineraryService.reorderItinerary(user.id, tripId, body);
  }

  @Patch(":tripId/itinerary/:itemId")
  updateItineraryItem(
    @CurrentUser() user: AuthUser,
    @Param("tripId") tripId: string,
    @Param("itemId") itemId: string,
    @Body(new ZodValidationPipe(updateItineraryItemSchema)) body: UpdateItineraryItemInput,
  ) {
    return this.itineraryService.updateItineraryItem(user.id, tripId, itemId, body);
  }

  @Delete(":tripId/itinerary/:itemId")
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeItineraryItem(
    @CurrentUser() user: AuthUser,
    @Param("tripId") tripId: string,
    @Param("itemId") itemId: string,
  ): Promise<void> {
    await this.itineraryService.deleteItineraryItem(user.id, tripId, itemId);
  }

  @Get(":tripId")
  getTrip(@CurrentUser() user: AuthUser, @Param("tripId") tripId: string) {
    return this.tripCrudService.getForUser(user.id, tripId);
  }

  @Patch(":tripId")
  updateTrip(
    @CurrentUser() user: AuthUser,
    @Param("tripId") tripId: string,
    @Body(new ZodValidationPipe(updateTripSchema)) body: UpdateTripInput,
  ) {
    return this.tripCrudService.updateForUser(user.id, tripId, body);
  }

  @Delete(":tripId")
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeTrip(@CurrentUser() user: AuthUser, @Param("tripId") tripId: string): Promise<void> {
    await this.tripCrudService.deleteForUser(user.id, tripId);
  }
}
