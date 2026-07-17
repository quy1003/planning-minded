import { getTranslations } from "next-intl/server";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { AppShellUser } from "@/features/auth/components/app-shell-user";
import { LogoutButton } from "@/features/auth/components/logout-button";
import { RequireAuth } from "@/features/auth/components/require-auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("AppShell");
  const tCommon = await getTranslations("Common");

  return (
    <RequireAuth>
      <div className="flex min-h-full flex-1 flex-col">
        <header className="border-b border-zinc-200 bg-white">
          <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-3 px-6">
            <div className="flex min-w-0 items-center gap-3">
              <span className="text-sm font-semibold tracking-wide text-teal-900">
                {tCommon("appName")}
              </span>
              <span className="hidden truncate text-sm text-zinc-500 sm:inline">{t("subtitle")}</span>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <LocaleSwitcher />
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
