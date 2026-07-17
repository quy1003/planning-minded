import { getTranslations } from "next-intl/server";
import { BrandMark } from "@/components/brand-mark";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { GuestOnly } from "@/features/auth/components/guest-only";
import { Link } from "@/i18n/navigation";

/**
 * Route group `(auth)` — login / register (guest only).
 * URL không có chữ "auth": `/vi/login`.
 */
export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("Auth");

  return (
    <GuestOnly>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-12">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div className="space-y-2">
            <Link href="/">
              <BrandMark />
            </Link>
            <p className="text-sm text-muted">{t("tagline")}</p>
          </div>
          <div className="flex items-center gap-2">
            <LocaleSwitcher />
            <ThemeToggle />
          </div>
        </div>
        {children}
      </div>
    </GuestOnly>
  );
}
