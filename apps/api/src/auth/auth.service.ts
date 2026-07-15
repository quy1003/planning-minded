import { HttpStatus, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { RegisterInput } from "@tripmind/shared";
import type { AuthUser } from "../common/decorators/current-user.decorator";
import { BusinessException } from "../common/exceptions/business.exception";
import { PrismaService } from "../prisma/prisma.service";
import { hashPassword, verifyPassword } from "./utils/password.util";

function toAuthUser(user: { id: string; email: string; name: string | null }): AuthUser {
  return { id: user.id, email: user.email, name: user.name };
}

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async register(input: RegisterInput): Promise<AuthUser> {
    const passwordHash = await hashPassword(input.password);
    try {
      const user = await this.prisma.user.create({
        data: {
          email: input.email.toLowerCase(),
          passwordHash,
          name: input.name ?? null,
        },
        select: { id: true, email: true, name: true },
      });
      return toAuthUser(user);
    } catch (error: unknown) {
      // P2002 = unique constraint (email đã tồn tại) → lỗi business, không phải 500
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new BusinessException("Email already registered", HttpStatus.CONFLICT);
      }
      throw error;
    }
  }

  /** Trả AuthUser nếu đúng; null nếu sai (strategy sẽ đổi thành 401). */
  async validateUser(email: string, password: string): Promise<AuthUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (!user) {
      return null;
    }
    const ok = await verifyPassword(user.passwordHash, password);
    if (!ok) {
      return null;
    }
    return toAuthUser(user);
  }

  async findById(id: string): Promise<AuthUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true },
    });
    return user ? toAuthUser(user) : null;
  }
}
