import type { INestApplication } from "@nestjs/common";
import { VersioningType } from "@nestjs/common";
import cookieParser from "cookie-parser";
import passport from "passport";
import { ConfigService } from "../config/config.service";
import { HttpExceptionFilter } from "../common/filters/http-exception.filter";
import { TransformInterceptor } from "../common/interceptors/transform.interceptor";

export function configureApp(app: INestApplication, configService: ConfigService): void {
  // URI versioning: /auth/login -> /v1/auth/login. Controller nào không nên có version
  // (JwksController, HealthController) tự khai báo version: VERSION_NEUTRAL, xem
  // docs/learning/47-api-versioning.md.
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: "1" });

  // Production đứng sau reverse proxy (Render...) — proxy nhận HTTPS rồi forward vào app bằng
  // HTTP nội bộ. Không set dòng này, Express luôn nghĩ request là HTTP → cookie `secure: true`
  // của refresh token sẽ không bao giờ được gửi xuống trình duyệt.
  if (configService.isProduction) {
    app.getHttpAdapter().getInstance().set("trust proxy", 1);
  }

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  // Cookie (refresh token) + browser: credentials cần origin cụ thể (không dùng `*`).
  // Local chủ yếu đi qua Next rewrite (same-origin); CORS vẫn cần nếu gọi Nest trực tiếp.
  app.enableCors({
    origin: configService.webOrigin,
    credentials: true,
  });

  // Đọc cookie refresh token (httpOnly) — /auth/refresh, /auth/logout cần req.cookies.
  app.use(cookieParser());

  // Vẫn cần cho AuthGuard("local") (LocalStrategy) chạy được — không còn passport.session()
  // vì không còn session nào để load (Phase 2 task #6: JWT thay session hoàn toàn).
  app.use(passport.initialize());
}
