import type { INestApplication } from "@nestjs/common";
import { ConfigService } from "../config/config.service";
import { HttpExceptionFilter } from "../common/filters/http-exception.filter";
import { TransformInterceptor } from "../common/interceptors/transform.interceptor";

/**
 * Phase 2 task #7: apps/api không còn cookie/password gì cả — chỉ verify JWT
 * (Bearer header). Không còn cookie-parser/passport (auth-service giữ hết).
 */
export function configureApp(app: INestApplication, configService: ConfigService): void {
  if (configService.isProduction) {
    app.getHttpAdapter().getInstance().set("trust proxy", 1);
  }

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  app.enableCors({
    origin: configService.webOrigin,
    credentials: true,
  });
}
