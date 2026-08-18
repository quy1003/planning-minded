import {
  Injectable,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { map, type Observable } from "rxjs";
import { SKIP_RESPONSE_TRANSFORM_KEY } from "../decorators/skip-response-transform.decorator";

export type SuccessResponse<T> = {
  data: T;
};

function isAlreadyWrapped(value: unknown): value is SuccessResponse<unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    "data" in value &&
    Object.keys(value).length === 1
  );
}

/**
 * Bọc mọi response thành công thành `{ data: ... }`.
 * `undefined`/`null` (vd 204 logout) giữ nguyên — không bọc.
 * Endpoint gắn `@SkipResponseTransform()` cũng giữ nguyên (vd JWKS).
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, SuccessResponse<T> | T> {
  constructor(private readonly reflector: Reflector = new Reflector()) {}

  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<SuccessResponse<T> | T> {
    const skipTransform = this.reflector.getAllAndOverride<boolean>(SKIP_RESPONSE_TRANSFORM_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skipTransform) {
      return next.handle();
    }

    return next.handle().pipe(
      map((payload) => {
        if (payload === undefined || payload === null) {
          return payload;
        }
        if (isAlreadyWrapped(payload)) {
          return payload;
        }
        return { data: payload };
      }),
    );
  }
}
