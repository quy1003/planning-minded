import { LogoutButton } from "@/features/auth/components/logout-button";
import { RequireAuth } from "@/features/auth/components/require-auth";
import { AppShellUser } from "@/features/auth/components/app-shell-user";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <div className="flex min-h-full flex-1 flex-col">
        <header className="border-b border-zinc-200 bg-white">
          <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-6">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold tracking-wide text-teal-900">TripMind</span>
              <span className="hidden text-sm text-zinc-500 sm:inline">Chuyến đi của bạn</span>
            </div>
            <div className="flex items-center gap-3">
              <AppShellUser />
              <LogoutButton />
            </div>
          </div>
        </header>
        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-8">{children}</div>
      </div>
    </RequireAuth>
  );
}
