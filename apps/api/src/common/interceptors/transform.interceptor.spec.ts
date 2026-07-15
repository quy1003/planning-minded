import { of } from "rxjs";
import { TransformInterceptor } from "./transform.interceptor";

describe("TransformInterceptor", () => {
  const interceptor = new TransformInterceptor();

  function run<T>(payload: T) {
    return new Promise((resolve) => {
      interceptor.intercept({} as never, { handle: () => of(payload) }).subscribe(resolve);
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
});
