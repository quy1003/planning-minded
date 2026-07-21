import type { INestApplication } from "@nestjs/common";
import session from "express-session";
import passport from "passport";
import { ConfigService } from "../config/config.service";
import { HttpExceptionFilter } from "../common/filters/http-exception.filter";
import { TransformInterceptor } from "../common/interceptors/transform.interceptor";

const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7; // 7 ngày

// sessionStore để trống -> express-session tự dùng MemoryStore mặc định (đủ cho test ngắn hạn).
// main.ts (app chạy thật) sẽ truyền RedisStore thật vào tham số này.
export function configureApp(app: INestApplication, configService: ConfigService, sessionStore?: session.Store): void {
  // Production đứng sau reverse proxy (Render...) — proxy nhận HTTPS rồi forward vào app bằng
  // HTTP nội bộ. Không set dòng này, Express luôn nghĩ request là HTTP → cookie `secure: true`
  // bên dưới sẽ không bao giờ được gửi xuống trình duyệt → đăng nhập xong bị đăng xuất ngay.
  if (configService.isProduction) {
    app.getHttpAdapter().getInstance().set("trust proxy", 1);
  }

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  // Cookie session + browser: credentials cần origin cụ thể (không dùng `*`).
  // Local chủ yếu đi qua Next rewrite (same-origin); CORS vẫn cần nếu gọi Nest trực tiếp.
  app.enableCors({
    origin: configService.webOrigin,
    credentials: true,
  });

  app.use(
    session({
      store: sessionStore,
      secret: configService.sessionSecret,
      name: "tripmind.sid",
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: configService.isProduction,
        maxAge: SESSION_MAX_AGE_MS,
      },
    }),
  );

  app.use(passport.initialize());
  app.use(passport.session());
}
