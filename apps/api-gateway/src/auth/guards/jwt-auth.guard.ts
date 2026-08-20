import { Injectable, UnauthorizedException, type CanActivate, type ExecutionContext } from "@nestjs/common";
import { userRoleSchema, type UserRole } from "@tripmind/shared";
import type { Request } from "express";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { ConfigService } from "../../config/config.service";

function extractBearerToken(authorizationHeader: string | undefined): string | null {
  if (!authorizationHeader?.startsWith("Bearer ")) {
    return null;
  }
  const token = authorizationHeader.slice("Bearer ".length).trim();
  return token.length > 0 ? token : null;
}

/**
 * Verify JWT "offline": không hỏi lại auth-service mỗi request — chỉ cần public key
 * (lấy qua JWKS, `createRemoteJWKSet` tự cache) để tự verify chữ ký tại chỗ.
 * Gateway chỉ gắn guard này cho /trips/* (mọi route trip-service đều cần login) — /auth/* và /destinations/* để nguyên cho service phía sau tự quyết (route công khai lẫn cần quyền trộn lẫn).
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly jwks: ReturnType<typeof createRemoteJWKSet>;

  constructor(configService: ConfigService) {
    this.jwks = createRemoteJWKSet(new URL(configService.jwksUrl));
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
