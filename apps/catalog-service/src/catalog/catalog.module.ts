import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { CatalogAccessService } from "./core/catalog-access.service";
import { CatalogRepository } from "./core/catalog.repository";
import { DestinationController } from "./destination/destination.controller";
import { DestinationService } from "./destination/destination.service";
import { PoiController } from "./poi/poi.controller";
import { PoiService } from "./poi/poi.service";

@Module({
  imports: [AuthModule],
  controllers: [DestinationController, PoiController],
  providers: [CatalogRepository, CatalogAccessService, DestinationService, PoiService],
})
export class CatalogModule {}
