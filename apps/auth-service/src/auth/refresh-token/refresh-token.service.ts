import { createHash, randomBytes } from "node:crypto";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

/** Export để AuthController dùng chung 1 giá trị cho `maxAge` cookie refresh token. */
export const REFRESH_TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 ngày

export type RotateResult = {
  userId: string;
  newToken: string;
};

function hashToken(token: string): string {
  // SHA-256 đủ (không cần argon2id chậm như password — token đã random 256 bit,
  // không phải thứ user tự nhớ/nhập nên không lo brute-force theo từ điển).
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Refresh token: chuỗi random, KHÔNG PHẢI JWT — không tự verify được bằng chữ ký,
 * hợp lệ hay không tra thẳng hash trong Postgres. Chỉ lưu hash (giống password) để
 * DB bị lộ cũng không dùng được token thật. Xem docs/adr/006-refresh-token-storage.md
 * (vì sao Postgres thay vì Redis-only).
 */
@Injectable()
export class RefreshTokenService {
  constructor(private readonly prisma: PrismaService) {}

  /** Tạo token mới cho userId, lưu hash vào DB (TTL 7 ngày). Trả token GỐC — chỉ 1 lần. */
  async issue(userId: string): Promise<string> {
    const token = randomBytes(32).toString("hex");
    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      },
    });
    return token;
  }

  /**
   * Rotation: đổi refresh token cũ lấy token mới. Token cũ bị xóa NGAY (không dùng lại
   * được lần 2) — dùng lại token cũ sau khi đã rotate là dấu hiệu token bị đánh cắp.
   */
  async rotate(oldToken: string): Promise<RotateResult> {
    const existingRefreshToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: hashToken(oldToken) },
    });

    if (!existingRefreshToken || existingRefreshToken.expiresAt < new Date()) {
      throw new UnauthorizedException({ detail: "Invalid or already-used refresh token" });
    }

    await this.prisma.refreshToken.delete({ where: { id: existingRefreshToken.id } });
    const newToken = await this.issue(existingRefreshToken.userId);
    return { userId: existingRefreshToken.userId, newToken };
  }

  /**
   * Thu hồi đúng 1 token (thiết bị hiện tại — vd logout). `deleteMany` (không phải
   * `delete`) — idempotent: token sai/đã hết hạn/đã bị revoke rồi vẫn không throw,
   * đúng ngữ nghĩa logout thông thường (khác `rotate()` — bước bảo mật, phải throw rõ).
   */
  async revoke(token: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({ where: { tokenHash: hashToken(token) } });
  }

  /** Thu hồi TOÀN BỘ refresh token của 1 user (đăng xuất mọi thiết bị). */
  async revokeAll(userId: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
  }
}
