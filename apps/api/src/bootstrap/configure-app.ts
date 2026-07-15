import type { INestApplication } from "@nestjs/common";
import session from "express-session";
import passport from "passport";
import { ConfigService } from "../config/config.service";
import { HttpExceptionFilter } from "../common/filters/http-exception.filter";

const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7; // 7 ngày

// sessionStore để trống -> express-session tự dùng MemoryStore mặc định (đủ cho test ngắn hạn).
// main.ts (app chạy thật) sẽ truyền RedisStore thật vào tham số này.
export function configureApp(app: INestApplication, configService: ConfigService, sessionStore?: session.Store): void {
  app.useGlobalFilters(new HttpExceptionFilter());

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
