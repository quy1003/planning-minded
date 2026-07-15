import { BadRequestException, type PipeTransform } from "@nestjs/common";
import type { ZodType } from "zod";

/**
 * Pipe dùng chung: nhận 1 zod schema, validate `value` (thường là req.body).
 * Dùng trên param: `@Body(new ZodValidationPipe(registerSchema)) body`
 */
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodType) {}

  transform(value: unknown): unknown {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        detail: "Validation failed",
        errors: result.error.issues.map((issue) => ({
          path: issue.path.join(".") || "(root)",
          message: issue.message,
        })),
      });
    }
    return result.data;
  }
}
