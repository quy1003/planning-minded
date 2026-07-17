import { GuestOnly } from "@/features/auth/components/guest-only";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <GuestOnly>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-12">
        <div className="mb-8 space-y-1">
          <p className="text-sm font-medium tracking-wide text-teal-800 uppercase">TripMind</p>
          <p className="text-sm text-zinc-600">Đăng nhập bằng session cookie (Phase 1).</p>
        </div>
        {children}
      </div>
    </GuestOnly>
  );
}
