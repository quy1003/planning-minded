import { getTranslations } from "next-intl/server";
import { BrandMark } from "@/components/brand-mark";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { AppShellUser } from "@/features/auth/components/app-shell-user";
import { LogoutButton } from "@/features/auth/components/logout-button";
import { RequireAuth } from "@/features/auth/components/require-auth";
import { Link } from "@/i18n/navigation";

/**
 * Route group `(app)` — khu vực đã đăng nhập (`/trips`…).
 * Header: mobile gọn (logo icon + actions); desktop đủ wordmark / nav / tên user.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("AppShell");

  return (
    <RequireAuth>
      <div className="flex min-h-full flex-1 flex-col bg-background text-foreground">
        <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur">
          <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-2 px-4 sm:gap-3 sm:px-6">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <Link href="/" className="shrink-0" aria-label="TripMind">
                <BrandMark collapseWordmarkOnMobile />
              </Link>
              <Link
                href="/trips"
                className="hidden truncate text-sm text-muted transition hover:text-foreground md:inline"
              >
                {t("navTrips")}
              </Link>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <LocaleSwitcher />
              <ThemeToggle />
              <AppShellUser />
              <LogoutButton />
            </div>
          </div>
        </header>
        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </div>
      </div>
    </RequireAuth>
  );
}
