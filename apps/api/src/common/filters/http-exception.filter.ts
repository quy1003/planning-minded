import {
  Catch,
  HttpException,
  HttpStatus,
  type ArgumentsHost,
  type ExceptionFilter,
} from "@nestjs/common";
import type { Request, Response } from "express";

type ProblemBody = {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  errors?: Array<{ path: string; message: string }>;
};

/**
 * RFC 9457 problem+json — mọi lỗi HTTP cùng 1 shape để client parse dễ.
 * Content-Type: application/problem+json
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const problem = this.toProblem(exception, status, request.url);
    response.status(status).type("application/problem+json").json(problem);
  }

  private toProblem(exception: unknown, status: number, instance: string): ProblemBody {
    const title = HttpStatus[status] ?? "Error";
    const type = `https://httpstatuses.com/${status}`;

    if (exception instanceof HttpException) {
      const payload = exception.getResponse();
      if (typeof payload === "string") {
        return { type, title, status, detail: payload, instance };
      }

      if (typeof payload === "object" && payload !== null) {
        const body = payload as Record<string, unknown>;
        const detail =
          typeof body.detail === "string"
            ? body.detail
            : typeof body.message === "string"
              ? body.message
              : Array.isArray(body.message)
                ? body.message.join("; ")
                : exception.message;

        const problem: ProblemBody = { type, title, status, detail, instance };
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
      detail: status === HttpStatus.INTERNAL_SERVER_ERROR ? "Internal server error" : "Unexpected error",
      instance,
    };
  }
}
