import { ApiProbe } from "@/components/api-probe";

/**
 * Slice 0 — trang scaffold: xác nhận web chạy + rewrite `/api/health` → Nest.
 * Auth / trips sẽ thay trang này ở slice sau.
 */
export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center gap-6 px-6 py-16">
      <div className="space-y-2">
        <p className="text-sm font-medium tracking-wide text-teal-800 uppercase">TripMind</p>
        <h1 className="text-3xl font-semibold tracking-tight">Web scaffold sẵn sàng</h1>
        <p className="text-zinc-600">
          Next.js (:3001) proxy <code className="rounded bg-zinc-200 px-1.5 py-0.5 text-sm">/api/*</code>{" "}
          sang Nest (:3000).
        </p>
      </div>
      <ApiProbe />
    </main>
  );
}
