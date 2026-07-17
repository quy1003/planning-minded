/**
 * Middleware đã redirect `/` → `/trips` hoặc `/login`.
 * Page này chỉ là fallback nếu matcher bỏ sót.
 */
export default function HomePage() {
  return (
    <main className="flex flex-1 items-center justify-center text-sm text-zinc-600">
      Đang chuyển hướng…
    </main>
  );
}
