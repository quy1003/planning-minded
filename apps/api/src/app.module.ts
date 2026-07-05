import { Module } from "@nestjs/common";
import { HealthModule } from "./health/health.module";
import { AuthModule } from "./auth/auth.module";
import { TripModule } from "./trip/trip.module";
import { CatalogModule } from "./catalog/catalog.module";
import { ConfigModule } from "./config/config.module";
import { PrismaModule } from "./prisma/prisma.module";
import { RedisModule } from "./redis/redis.module";

@Module({
  imports: [ConfigModule, PrismaModule, RedisModule, HealthModule, AuthModule, TripModule, CatalogModule],
})
export class AppModule {}
