import { Module } from "@nestjs/common";
import { HealthModule } from "./health/health.module";
import { AuthModule } from "./auth/auth.module";
import { TripModule } from "./trip/trip.module";
import { CatalogModule } from "./catalog/catalog.module";
import { ConfigModule } from "./config/config.module";

@Module({
  imports: [ConfigModule, HealthModule, AuthModule, TripModule, CatalogModule],
})
export class AppModule {}
