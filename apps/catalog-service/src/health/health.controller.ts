import { Controller, Get, VERSION_NEUTRAL } from "@nestjs/common";

// version: VERSION_NEUTRAL — health check là path cố định để orchestrator/load balancer
// poll, không nên đổi theo version API.
@Controller({ path: "health", version: VERSION_NEUTRAL })
export class HealthController {
  @Get()
  check() {
    return { status: "ok" };
  }
}
