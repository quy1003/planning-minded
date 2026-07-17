/**
 * Placeholder Slice 1 — Slice 2 sẽ thay bằng list/CRUD trip thật.
 */
export default function TripsPage() {
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold tracking-tight">Trips</h1>
      <p className="text-zinc-600">
        Bạn đã đăng nhập. CRUD trip + bản đồ sẽ làm ở slice tiếp theo.
      </p>
      <div className="rounded-lg border border-dashed border-zinc-300 bg-white px-4 py-8 text-center text-sm text-zinc-500">
        Chưa có UI list trip — API <code className="rounded bg-zinc-100 px-1">GET /trips</code> đã sẵn
        sàng.
      </div>
    </div>
  );
}
