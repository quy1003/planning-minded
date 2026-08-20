import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import {
  createDestinationSchema,
  listDestinationsQuerySchema,
  updateDestinationSchema,
  type CreateDestinationInput,
  type ListDestinationsQuery,
  type UpdateDestinationInput,
} from "@tripmind/shared";
import { AdminGuard } from "../../auth/guards/admin.guard";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { DestinationService } from "./destination.service";

/**
 * 2 mức quyền trên cùng resource (D2 vs D3): route đọc (GET) không có guard nào — public,
 * ai gọi cũng được. Route ghi (POST/PATCH/DELETE) cần `@UseGuards(JwtAuthGuard, AdminGuard)`
 * — JwtAuthGuard verify token trước, AdminGuard mới check role (thứ tự bắt buộc).
 */
@Controller("destinations")
export class DestinationController {
  constructor(private readonly destinationService: DestinationService) {}

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @HttpCode(HttpStatus.CREATED)
  create(@Body(new ZodValidationPipe(createDestinationSchema)) body: CreateDestinationInput) {
    return this.destinationService.create(body);
  }

  @Get()
  list(@Query(new ZodValidationPipe(listDestinationsQuerySchema)) query: ListDestinationsQuery) {
    return this.destinationService.list(query);
  }

  @Get(":destinationId")
  get(@Param("destinationId") destinationId: string) {
    return this.destinationService.get(destinationId);
  }

  @Patch(":destinationId")
  @UseGuards(JwtAuthGuard, AdminGuard)
  update(
    @Param("destinationId") destinationId: string,
    @Body(new ZodValidationPipe(updateDestinationSchema)) body: UpdateDestinationInput,
  ) {
    return this.destinationService.update(destinationId, body);
  }

  @Delete(":destinationId")
  @UseGuards(JwtAuthGuard, AdminGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param("destinationId") destinationId: string): Promise<void> {
    await this.destinationService.delete(destinationId);
  }
}
