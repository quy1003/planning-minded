import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { CatalogAccessService } from "./catalog-access.service";
import { CatalogRepository } from "./catalog.repository";
import { DestinationController } from "./destination.controller";
import { DestinationService } from "./destination.service";
import { PoiController } from "./poi.controller";
import { PoiService } from "./poi.service";

@Module({
  imports: [AuthModule],
  controllers: [DestinationController, PoiController],
  providers: [CatalogRepository, CatalogAccessService, DestinationService, PoiService],
})
export class CatalogModule {}
