import { BadRequestException } from "@nestjs/common";
import { z } from "zod";
import { ZodValidationPipe } from "./zod-validation.pipe";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

describe("ZodValidationPipe", () => {
  const pipe = new ZodValidationPipe(schema);

  it("returns parsed data when input is valid", () => {
    const input = { email: "a@a.com", password: "password123" };
    expect(pipe.transform(input)).toEqual(input);
  });

  it("throws BadRequestException with errors when input is invalid", () => {
    expect(() => pipe.transform({ password: "123" })).toThrow(BadRequestException);

    try {
      pipe.transform({ password: "123" });
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(BadRequestException);
      const body = (error as BadRequestException).getResponse() as {
        detail: string;
        errors: Array<{ path: string; message: string }>;
      };
      expect(body.detail).toBe("Validation failed");
      expect(body.errors.length).toBeGreaterThan(0);
      expect(body.errors.some((e) => e.path === "email")).toBe(true);
    }
  });
});
