"use client";

import { useEffect, useState } from "react";
import { ApiError, api } from "@/lib/api-client";

type Health = { status: string };

/**
 * Client probe — chứng minh rewrite + api-client hoạt động.
 * Slice auth sẽ thay bằng useMe / Query.
 */
export function ApiProbe() {
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  const [message, setMessage] = useState("Đang gọi /api/health…");

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const health = await api.get<Health>("/health");
        if (cancelled) return;
        setState("ok");
        setMessage(`Nest health: ${JSON.stringify(health)}`);
      } catch (error: unknown) {
        if (cancelled) return;
        setState("error");
        if (error instanceof ApiError) {
          setMessage(`${error.status}: ${error.message}`);
        } else if (error instanceof Error) {
          setMessage(error.message);
        } else {
          setMessage("Unknown error");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const tone =
    state === "ok"
      ? "border-teal-300 bg-teal-50 text-teal-900"
      : state === "error"
        ? "border-red-300 bg-red-50 text-red-900"
        : "border-zinc-200 bg-white text-zinc-700";

  return (
    <div className={`rounded-lg border px-4 py-3 text-sm ${tone}`}>
      <p className="font-medium">API probe</p>
      <p className="mt-1 font-mono text-xs break-all">{message}</p>
      {state === "error" && (
        <p className="mt-2 text-xs opacity-80">
          Chạy Nest trước: <code>pnpm --filter @tripmind/api dev</code> hoặc{" "}
          <code>pnpm dev</code> (turbo).
        </p>
      )}
    </div>
  );
}
