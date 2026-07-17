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
 * URL không có chữ "app". Header shell riêng (không dùng marketing footer).
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("AppShell");

  return (
    <RequireAuth>
      <div className="flex min-h-full flex-1 flex-col bg-background text-foreground">
        <header className="border-b border-border bg-surface/90 backdrop-blur">
          <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-3 px-6">
            <div className="flex min-w-0 items-center gap-4">
              <Link href="/" className="shrink-0">
                <BrandMark />
              </Link>
              <Link
                href="/trips"
                className="hidden text-sm text-muted transition hover:text-foreground sm:inline"
              >
                {t("navTrips")}
              </Link>
            </div>
            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <LocaleSwitcher />
              <ThemeToggle />
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
