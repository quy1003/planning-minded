import { All, Controller, Req, Res, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "@tripmind/shared";
import type { Request, Response } from "express";
import { SkipResponseTransform } from "../common/decorators/skip-response-transform.decorator";
import { ConfigService } from "../config/config.service";
import { ProxyService } from "./proxy.service";

/**
 * Không dùng `app.enableVersioning()` (xem bootstrap/configure-app.ts) — "v1" ở đây là literal
 * path segment, vì gateway chỉ forward nguyên `req.originalUrl` (đã có sẵn "/v1/..." do browser
 * gửi) sang service đích, không tự diễn giải version.
 *
 * Mọi handler dùng `@Res()` để ProxyService tự quản toàn bộ response (status/headers/body) —
 * KHÔNG để TransformInterceptor bọc thêm `{ data }` (service đích đã trả đúng format cuối rồi).
 * `@SkipResponseTransform()` thêm để rõ ý định dù `@Res()` đã tự bypass interceptor.
 */
@Controller("v1")
@SkipResponseTransform()
export class ProxyController {
  constructor(
    private readonly proxyService: ProxyService,
    private readonly configService: ConfigService,
  ) {}

  // 2 path/route: "auth" (bare, vd tương lai có thể có route không con) và "auth/*path" (có
  // path con). path-to-regexp v8 (Express 5, NestJS 11 dùng mặc định) — wildcard `*path` bắt
  // buộc khớp ÍT NHẤT 1 segment, KHÔNG tự khớp path trần — thiếu dòng "auth" riêng thì
  // GET /v1/trips (không có gì sau "trips") sẽ lọt xuống route fallback `*path` bên dưới.
  @All(["auth", "auth/*path"])
  proxyAuth(@Req() req: Request, @Res() res: Response) {
    // /auth/login, /auth/register công khai; /auth/me, /auth/logout-all cần JWT — mỗi route đã
    // tự bảo vệ đúng ở auth-service (mixed access trong cùng prefix) — gateway không đoán lại.
    return this.proxyService.forward(req, res, this.configService.authServiceInternalUrl);
  }

  @All(["trips", "trips/*path"])
  @UseGuards(JwtAuthGuard)
  proxyTrips(@Req() req: Request, @Res() res: Response) {
    // Toàn bộ /trips/* đều cần login (TripController/PlaceController/ItineraryController đều
    // @UseGuards(JwtAuthGuard)) — gateway chặn sớm được an toàn ở đây, không sợ chặn nhầm route
    // công khai như /auth/* hay /destinations/*.
    return this.proxyService.forward(req, res, this.configService.tripServiceInternalUrl);
  }

  @All(["destinations", "destinations/*path"])
  proxyDestinations(@Req() req: Request, @Res() res: Response) {
    // GET công khai, POST/PATCH/DELETE cần admin — mixed access, để catalog-service tự quyết
    // qua AdminGuard của chính nó, giống /auth/*.
    return this.proxyService.forward(req, res, this.configService.catalogServiceInternalUrl);
  }

  // Fallback — PHẢI đứng SAU 3 route cụ thể ở trên (Nest match theo thứ tự khai báo, wildcard
  // rộng hơn đứng trước sẽ "nuốt" hết auth/trips/destinations).
  @All("*path")
  proxyRest(@Req() req: Request, @Res() res: Response) {
    return this.proxyService.forward(req, res, this.configService.apiInternalUrl);
  }
}
