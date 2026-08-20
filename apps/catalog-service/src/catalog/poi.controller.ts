import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from "@nestjs/common";
import {
  createPoiSchema,
  updatePoiSchema,
  type CreatePoiInput,
  type UpdatePoiInput,
} from "@tripmind/shared";
import { AdminGuard } from "../auth/guards/admin.guard";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { PoiService } from "./poi.service";

/** Poi luôn nằm dưới 1 destination — route `/destinations/:destinationId/pois`, giống cách
 * `trips/:tripId/places` tổ chức ở trip-service. */
@Controller("destinations/:destinationId/pois")
export class PoiController {
  constructor(private readonly poiService: PoiService) {}

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @HttpCode(HttpStatus.CREATED)
  create(
    @Param("destinationId") destinationId: string,
    @Body(new ZodValidationPipe(createPoiSchema)) body: CreatePoiInput,
  ) {
    return this.poiService.create(destinationId, body);
  }

  @Get()
  list(@Param("destinationId") destinationId: string) {
    return this.poiService.list(destinationId);
  }

  @Patch(":poiId")
  @UseGuards(JwtAuthGuard, AdminGuard)
  update(
    @Param("destinationId") destinationId: string,
    @Param("poiId") poiId: string,
    @Body(new ZodValidationPipe(updatePoiSchema)) body: UpdatePoiInput,
  ) {
    return this.poiService.update(destinationId, poiId, body);
  }

  @Delete(":poiId")
  @UseGuards(JwtAuthGuard, AdminGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param("destinationId") destinationId: string,
    @Param("poiId") poiId: string,
  ): Promise<void> {
    await this.poiService.delete(destinationId, poiId);
  }
}
