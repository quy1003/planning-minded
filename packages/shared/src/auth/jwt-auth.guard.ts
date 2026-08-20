import {
  Inject,
  Injectable,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from "@nestjs/common";
import type { Request } from "express";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { userRoleSchema, type UserRole } from "./role";

/**
 * Token DI cho URL JWKS — mỗi app tự provide giá trị này từ `ConfigService` riêng của nó
 * (mỗi app có `ConfigService` khác nhau, `JwtAuthGuard` ở đây không biết/không cần biết app
 * nào đang chạy). Ví dụ đăng ký trong `auth.module.ts` của app:
 *
 * ```ts
 * providers: [
 *   JwtAuthGuard,
 *   { provide: JWKS_URL, useFactory: (config: ConfigService) => config.jwksUrl, inject: [ConfigService] },
 * ],
 * ```
 */
export const JWKS_URL = Symbol("JWKS_URL");

function extractBearerToken(authorizationHeader: string | undefined): string | null {
  if (!authorizationHeader?.startsWith("Bearer ")) {
    return null;
  }
  const token = authorizationHeader.slice("Bearer ".length).trim();
  return token.length > 0 ? token : null;
}

/**
 * Verify JWT "offline" bằng JWKS — dùng CHUNG cho mọi service tự verify (không tự ký) JWT:
 * auth-service (route nội bộ như /auth/logout-all), apps/api, trip-service, catalog-service,
 * api-gateway. Trước Phase 3 task #5 (chỗ gộp guard này vào packages/shared), mỗi service tự
 * copy tay 1 bản y hệt — rủi ro thật: sửa 1 chỗ (vd vá lỗ hổng bảo mật) quên sửa chỗ khác.
 * Gộp về đây để chỉ có 1 chỗ cần sửa, mọi service tự động nhận thay đổi qua `@tripmind/shared`.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly jwks: ReturnType<typeof createRemoteJWKSet>;

  constructor(@Inject(JWKS_URL) jwksUrl: string) {
    this.jwks = createRemoteJWKSet(new URL(jwksUrl));
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = extractBearerToken(request.headers.authorization);
    if (!token) {
      throw new UnauthorizedException({ detail: "Missing bearer token" });
    }

    let userId: string;
    let role: UserRole;
    try {
      const { payload } = await jwtVerify(token, this.jwks, { algorithms: ["EdDSA"] });
      if (typeof payload.sub !== "string") {
        throw new Error("Access token thiếu claim 'sub'");
      }
      userId = payload.sub;
      role = userRoleSchema.parse(payload.role);
    } catch {
      // Không lộ chi tiết lỗi crypto (hết hạn / sai chữ ký / sai format) ra ngoài.
      throw new UnauthorizedException({ detail: "Invalid or expired token" });
    }

    request.jwtUser = { id: userId, role };
    return true;
  }
}

// Đặt cùng file với JwtAuthGuard (không tách .d.ts riêng — thử rồi: .d.ts không compile ra .js,
// import nó ở index.ts sinh ra `require()` trỏ tới file không tồn tại, lỗi ngay lúc chạy).
// Mọi app import JwtAuthGuard từ file NÀY (không phải qua side-effect import) nên type
// `Request.jwtUser` tự merge global theo, không cần app nào tự khai báo lại.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace -- cách duy nhất TS hỗ trợ để augment global namespace có sẵn (Express), không có cú pháp ES2015 module thay thế.
  namespace Express {
    interface Request {
      /** Gắn bởi JwtAuthGuard sau khi verify JWT thành công. */
      jwtUser?: { id: string; role: UserRole };
    }
  }
}
