import { createHash, randomUUID } from "node:crypto";
import { UnauthorizedException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { PrismaService } from "../prisma/prisma.service";
import { RefreshTokenService } from "./refresh-token.service";

type FakeRefreshTokenRow = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
};

describe("RefreshTokenService", () => {
  // Fake Prisma đơn giản bằng Map — đủ để test logic hash/rotation, không cần DB thật.
  const rowsByTokenHash = new Map<string, FakeRefreshTokenRow>();
  const fakePrisma = {
    refreshToken: {
      create: jest.fn(async ({ data }: { data: { userId: string; tokenHash: string; expiresAt: Date } }) => {
        const row: FakeRefreshTokenRow = { id: randomUUID(), ...data };
        rowsByTokenHash.set(data.tokenHash, row);
        return row;
      }),
      findUnique: jest.fn(async ({ where }: { where: { tokenHash: string } }) => {
        return rowsByTokenHash.get(where.tokenHash) ?? null;
      }),
      delete: jest.fn(async ({ where }: { where: { id: string } }) => {
        const row = [...rowsByTokenHash.values()].find((candidate) => candidate.id === where.id);
        if (row) rowsByTokenHash.delete(row.tokenHash);
        return row;
      }),
      deleteMany: jest.fn(async ({ where }: { where: { tokenHash?: string; userId?: string } }) => {
        const rowsToDelete = [...rowsByTokenHash.values()].filter(
          (candidate) =>
            (where.tokenHash === undefined || candidate.tokenHash === where.tokenHash) &&
            (where.userId === undefined || candidate.userId === where.userId),
        );
        for (const row of rowsToDelete) rowsByTokenHash.delete(row.tokenHash);
        return { count: rowsToDelete.length };
      }),
    },
  };

  let refreshTokenService: RefreshTokenService;

  beforeEach(async () => {
    rowsByTokenHash.clear();
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [RefreshTokenService, { provide: PrismaService, useValue: fakePrisma }],
    }).compile();

    refreshTokenService = moduleRef.get(RefreshTokenService);
  });

  it("issue() lưu hash (không phải plaintext) vào DB với expiresAt 7 ngày sau", async () => {
    const token = await refreshTokenService.issue("user-1");

    expect(fakePrisma.refreshToken.create).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        tokenHash: expect.stringMatching(/^[0-9a-f]{64}$/), // sha256 hex = 64 ký tự
        expiresAt: expect.any(Date),
      },
    });
    const storedTokenHash = fakePrisma.refreshToken.create.mock.calls[0]?.[0]?.data.tokenHash as string;
    expect(storedTokenHash).not.toBe(token); // hash lưu, không phải token gốc

    const storedRow = rowsByTokenHash.get(storedTokenHash);
    if (!storedRow) {
      throw new Error("Row không được lưu đúng key trong fake Prisma");
    }
    const daysUntilExpiry = (storedRow.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    expect(daysUntilExpiry).toBeCloseTo(7, 1);
  });

  it("rotate() với token hợp lệ trả về userId + token mới, xóa token cũ", async () => {
    const oldToken = await refreshTokenService.issue("user-1");

    const result = await refreshTokenService.rotate(oldToken);

    expect(result.userId).toBe("user-1");
    expect(result.newToken).not.toBe(oldToken);
    expect(fakePrisma.refreshToken.delete).toHaveBeenCalled();
  });

  it("rotate() dùng lại token cũ (đã rotate rồi) phải throw Unauthorized", async () => {
    const oldToken = await refreshTokenService.issue("user-1");
    await refreshTokenService.rotate(oldToken); // lần 1: hợp lệ, token cũ bị xóa

    await expect(refreshTokenService.rotate(oldToken)).rejects.toBeInstanceOf(
      UnauthorizedException,
    ); // lần 2: token đã bị xóa -> fail
  });

  it("rotate() với token không tồn tại phải throw Unauthorized", async () => {
    await expect(refreshTokenService.rotate("token-khong-ton-tai")).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it("rotate() với token đã hết hạn phải throw Unauthorized", async () => {
    const expiredToken = "expired-token-gia-lap";
    // Ghi tay 1 row hết hạn — issue() luôn set hạn tương lai nên không dùng được cho test này.
    const expiredTokenHash = createHash("sha256").update(expiredToken).digest("hex");
    rowsByTokenHash.set(expiredTokenHash, {
      id: randomUUID(),
      userId: "user-1",
      tokenHash: expiredTokenHash,
      expiresAt: new Date(Date.now() - 1000),
    });

    await expect(refreshTokenService.rotate(expiredToken)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it("revoke() xóa đúng token đó, token bị revoke rồi rotate() phải throw Unauthorized", async () => {
    const token = await refreshTokenService.issue("user-1");

    await refreshTokenService.revoke(token);

    expect(rowsByTokenHash.size).toBe(0);
    await expect(refreshTokenService.rotate(token)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("revoke() với token không tồn tại không throw (idempotent, giống logout thường)", async () => {
    await expect(refreshTokenService.revoke("token-khong-ton-tai")).resolves.toBeUndefined();
  });

  it("revokeAll() xóa hết token của user đó, không đụng token user khác", async () => {
    const tokenA1 = await refreshTokenService.issue("user-a");
    const tokenA2 = await refreshTokenService.issue("user-a");
    const tokenB1 = await refreshTokenService.issue("user-b");

    await refreshTokenService.revokeAll("user-a");

    await expect(refreshTokenService.rotate(tokenA1)).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(refreshTokenService.rotate(tokenA2)).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(refreshTokenService.rotate(tokenB1)).resolves.toMatchObject({ userId: "user-b" });
  });
});
