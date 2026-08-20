import { Module } from "@nestjs/common";
import { HealthModule } from "./health/health.module";
import { ConfigModule } from "./config/config.module";
import { ProxyModule } from "./proxy/proxy.module";

@Module({
  imports: [ConfigModule, HealthModule, ProxyModule],
})
export class AppModule {}
