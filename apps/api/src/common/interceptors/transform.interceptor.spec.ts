import { of } from "rxjs";
import { Reflector } from "@nestjs/core";
import { SKIP_RESPONSE_TRANSFORM_KEY } from "../decorators/skip-response-transform.decorator";
import { TransformInterceptor } from "./transform.interceptor";

describe("TransformInterceptor", () => {
  const interceptor = new TransformInterceptor();

  function run<T>(payload: T) {
    return new Promise((resolve) => {
      interceptor
        .intercept(
          {
            getHandler: () => function handler() {},
            getClass: () => class TestController {},
          } as never,
          { handle: () => of(payload) },
        )
        .subscribe(resolve);
    });
  }

  it("wraps payload in { data }", async () => {
    await expect(run({ id: "1" })).resolves.toEqual({ data: { id: "1" } });
  });

  it("does not wrap null/undefined (e.g. 204)", async () => {
    await expect(run(undefined)).resolves.toBeUndefined();
    await expect(run(null)).resolves.toBeNull();
  });

  it("does not double-wrap", async () => {
    await expect(run({ data: { id: "1" } })).resolves.toEqual({ data: { id: "1" } });
  });

  it("skips wrap when @SkipResponseTransform is set", async () => {
    const reflector = new Reflector();
    const handler = function jwksHandler() {};
    Reflect.defineMetadata(SKIP_RESPONSE_TRANSFORM_KEY, true, handler);

    const jwks = { keys: [{ kid: "1" }] };
    await expect(
      new Promise((resolve) => {
        new TransformInterceptor(reflector)
          .intercept(
            {
              getHandler: () => handler,
              getClass: () => class JwksController {},
            } as never,
            { handle: () => of(jwks) },
          )
          .subscribe(resolve);
      }),
    ).resolves.toEqual(jwks);
  });
});
