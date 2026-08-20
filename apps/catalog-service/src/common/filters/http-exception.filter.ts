import {
  Catch,
  HttpException,
  HttpStatus,
  Logger,
  type ArgumentsHost,
  type ExceptionFilter,
} from "@nestjs/common";
import type { Request, Response } from "express";

export type ErrorCategory = "business" | "system";

type ProblemBody = {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  category: ErrorCategory;
  errors?: Array<{ path: string; message: string }>;
};

/**
 * RFC 9457 problem+json.
 * - business: lỗi 4xx / BusinessException (client xử lý được)
 * - system: 5xx hoặc exception lạ — log nội bộ, message chung ra ngoài
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const problem = this.toProblem(exception, status, request.url);

    if (problem.category === "system") {
      const stack = exception instanceof Error ? exception.stack : undefined;
      this.logger.error(`Unhandled error on ${request.method} ${request.url}`, stack);
    }

    response.status(status).type("application/problem+json").json(problem);
  }

  private toProblem(exception: unknown, status: number, instance: string): ProblemBody {
    const title = HttpStatus[status] ?? "Error";
    const type = `https://httpstatuses.com/${status}`;
    const category = this.resolveCategory(exception, status);

    if (exception instanceof HttpException) {
      const payload = exception.getResponse();
      if (typeof payload === "string") {
        return {
          type,
          title,
          status,
          detail: category === "system" ? "Internal server error" : payload,
          instance,
          category,
        };
      }

      if (typeof payload === "object" && payload !== null) {
        const body = payload as Record<string, unknown>;
        const rawDetail =
          typeof body.detail === "string"
            ? body.detail
            : typeof body.message === "string"
              ? body.message
              : Array.isArray(body.message)
                ? body.message.join("; ")
                : exception.message;

        const problem: ProblemBody = {
          type,
          title,
          status,
          detail: category === "system" ? "Internal server error" : rawDetail,
          instance,
          category,
        };
        if (Array.isArray(body.errors)) {
          problem.errors = body.errors as Array<{ path: string; message: string }>;
        }
        return problem;
      }
    }

    return {
      type,
      title,
      status,
      detail: "Internal server error",
      instance,
      category: "system",
    };
  }

  private resolveCategory(exception: unknown, status: number): ErrorCategory {
    if (exception instanceof HttpException) {
      const payload = exception.getResponse();
      if (typeof payload === "object" && payload !== null && "category" in payload) {
        const cat = (payload as { category?: unknown }).category;
        if (cat === "business" || cat === "system") {
          return cat;
        }
      }
      return status >= HttpStatus.INTERNAL_SERVER_ERROR ? "system" : "business";
    }
    return "system";
  }
}
