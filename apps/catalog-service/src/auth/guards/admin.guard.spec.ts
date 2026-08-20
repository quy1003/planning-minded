import { ForbiddenException, type ExecutionContext } from "@nestjs/common";
import { AdminGuard } from "./admin.guard";

function createContext(jwtUser: { id: string; role: string } | undefined): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ jwtUser }),
    }),
  } as unknown as ExecutionContext;
}

describe("AdminGuard", () => {
  const guard = new AdminGuard();

  it("allows when jwtUser.role is ADMIN", () => {
    const context = createContext({ id: "u1", role: "ADMIN" });
    expect(guard.canActivate(context)).toBe(true);
  });

  it("throws ForbiddenException when jwtUser.role is USER", () => {
    const context = createContext({ id: "u1", role: "USER" });
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it("throws (lỗi cấu hình) when jwtUser is missing — nghĩa là thiếu JwtAuthGuard đứng trước", () => {
    const context = createContext(undefined);
    expect(() => guard.canActivate(context)).toThrow("AdminGuard used without JwtAuthGuard");
  });
});
