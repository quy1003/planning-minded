import { UnauthorizedException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { AuthService } from "../auth.service";
import { LocalStrategy } from "./local.strategy";

describe("LocalStrategy", () => {
  const validateUser = jest.fn();

  beforeEach(() => {
    validateUser.mockReset();
  });

  async function createStrategy() {
    const moduleRef = await Test.createTestingModule({
      providers: [
        LocalStrategy,
        {
          provide: AuthService,
          useValue: { validateUser },
        },
      ],
    }).compile();

    return moduleRef.get(LocalStrategy);
  }

  it("returns AuthUser when credentials are valid", async () => {
    const user = { id: "u1", email: "a@a.com", name: null };
    validateUser.mockResolvedValue(user);
    const strategy = await createStrategy();

    await expect(strategy.validate("a@a.com", "password123")).resolves.toEqual(user);
    expect(validateUser).toHaveBeenCalledWith("a@a.com", "password123");
  });

  it("throws UnauthorizedException when credentials are invalid", async () => {
    validateUser.mockResolvedValue(null);
    const strategy = await createStrategy();

    await expect(strategy.validate("a@a.com", "wrong")).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
