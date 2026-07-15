import {
  Injectable,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from "@nestjs/common";
import { map, type Observable } from "rxjs";

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
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, SuccessResponse<T> | T> {
  intercept(_context: ExecutionContext, next: CallHandler<T>): Observable<SuccessResponse<T> | T> {
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
