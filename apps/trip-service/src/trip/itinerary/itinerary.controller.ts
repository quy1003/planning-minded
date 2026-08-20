import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from "@nestjs/common";
import {
  createItineraryItemSchema,
  JwtAuthGuard,
  reorderItinerarySchema,
  updateItineraryItemSchema,
  type CreateItineraryItemInput,
  type ReorderItineraryInput,
  type UpdateItineraryItemInput,
} from "@tripmind/shared";
import { CurrentUserId } from "../../common/decorators/current-user-id.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { ItineraryService } from "./itinerary.service";

@Controller("trips/:tripId/itinerary")
@UseGuards(JwtAuthGuard)
export class ItineraryController {
  constructor(private readonly itineraryService: ItineraryService) {}

  @Get()
  listItinerary(@CurrentUserId() userId: string, @Param("tripId") tripId: string) {
    return this.itineraryService.listItinerary(userId, tripId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  addItineraryItem(
    @CurrentUserId() userId: string,
    @Param("tripId") tripId: string,
    @Body(new ZodValidationPipe(createItineraryItemSchema)) body: CreateItineraryItemInput,
  ) {
    return this.itineraryService.addItineraryItem(userId, tripId, body);
  }

  // `reorder` phải đứng TRƯỚC `:itemId` — cùng độ sâu path, Nest match theo thứ tự khai báo,
  // đứng sau sẽ bị `:itemId` "nuốt" mất (coi "reorder" là 1 itemId).
  @Patch("reorder")
  reorderItinerary(
    @CurrentUserId() userId: string,
    @Param("tripId") tripId: string,
    @Body(new ZodValidationPipe(reorderItinerarySchema)) body: ReorderItineraryInput,
  ) {
    return this.itineraryService.reorderItinerary(userId, tripId, body);
  }

  @Patch(":itemId")
  updateItineraryItem(
    @CurrentUserId() userId: string,
    @Param("tripId") tripId: string,
    @Param("itemId") itemId: string,
    @Body(new ZodValidationPipe(updateItineraryItemSchema)) body: UpdateItineraryItemInput,
  ) {
    return this.itineraryService.updateItineraryItem(userId, tripId, itemId, body);
  }

  @Delete(":itemId")
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeItineraryItem(
    @CurrentUserId() userId: string,
    @Param("tripId") tripId: string,
    @Param("itemId") itemId: string,
  ): Promise<void> {
    await this.itineraryService.deleteItineraryItem(userId, tripId, itemId);
  }
}
