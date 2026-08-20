import { Controller, Get } from "@nestjs/common";

// Gateway không gọi enableVersioning (xem bootstrap/configure-app.ts) nên không cần
// version: VERSION_NEUTRAL như các service khác — không có version nào để "trung lập" với.
@Controller("health")
export class HealthController {
  @Get()
  check() {
    return { status: "ok" };
  }
}
