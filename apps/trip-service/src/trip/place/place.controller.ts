import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from "@nestjs/common";
import {
  createPlaceSchema,
  JwtAuthGuard,
  updatePlaceSchema,
  type CreatePlaceInput,
  type UpdatePlaceInput,
} from "@tripmind/shared";
import { CurrentUserId } from "../../common/decorators/current-user-id.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { PlaceService } from "./place.service";

@Controller("trips/:tripId/places")
@UseGuards(JwtAuthGuard)
export class PlaceController {
  constructor(private readonly placeService: PlaceService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  addPlace(
    @CurrentUserId() userId: string,
    @Param("tripId") tripId: string,
    @Body(new ZodValidationPipe(createPlaceSchema)) body: CreatePlaceInput,
  ) {
    return this.placeService.addPlace(userId, tripId, body);
  }

  @Get()
  listPlaces(@CurrentUserId() userId: string, @Param("tripId") tripId: string) {
    return this.placeService.listPlaces(userId, tripId);
  }

  @Patch(":placeId")
  updatePlace(
    @CurrentUserId() userId: string,
    @Param("tripId") tripId: string,
    @Param("placeId") placeId: string,
    @Body(new ZodValidationPipe(updatePlaceSchema)) body: UpdatePlaceInput,
  ) {
    return this.placeService.updatePlace(userId, tripId, placeId, body);
  }

  @Delete(":placeId")
  @HttpCode(HttpStatus.NO_CONTENT)
  async removePlace(
    @CurrentUserId() userId: string,
    @Param("tripId") tripId: string,
    @Param("placeId") placeId: string,
  ): Promise<void> {
    await this.placeService.deletePlace(userId, tripId, placeId);
  }
}
