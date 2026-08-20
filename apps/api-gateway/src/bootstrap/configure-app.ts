import type { INestApplication } from "@nestjs/common";
import { ConfigService } from "../config/config.service";
import { HttpExceptionFilter } from "../common/filters/http-exception.filter";
import { TransformInterceptor } from "../common/interceptors/transform.interceptor";

/**
 * KHÔNG gọi `app.enableVersioning(...)` ở đây (khác mọi service khác) — gateway không
 * "sở hữu" version API nào của riêng nó, nó chỉ forward nguyên `req.originalUrl` (đã có sẵn
 * "/v1/..." từ browser) sang service đích. Route controller hardcode literal "v1" trong path
 * (`ProxyController`) — xem docs/learning/50-api-gateway.md.
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
