import { getTranslations } from "next-intl/server";
import { GuestOnly } from "@/features/auth/components/guest-only";
import { LocaleSwitcher } from "@/components/locale-switcher";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("Auth");
  const tCommon = await getTranslations("Common");

  return (
    <GuestOnly>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-12">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium tracking-wide text-teal-800 uppercase">
              {tCommon("appName")}
            </p>
            <p className="text-sm text-zinc-600">{t("tagline")}</p>
          </div>
          <LocaleSwitcher />
        </div>
        {children}
      </div>
    </GuestOnly>
  );
}
