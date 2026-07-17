"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type AppLocale } from "@/i18n/routing";

export function LocaleSwitcher() {
  const t = useTranslations("Locale");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <label className="flex items-center gap-2 text-sm text-zinc-600">
      <span className="sr-only">{t("label")}</span>
      <select
        className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm outline-none focus:border-teal-600"
        value={locale}
        aria-label={t("label")}
        onChange={(event) => {
          const next = event.target.value as AppLocale;
          router.replace(pathname, { locale: next });
        }}
      >
        {routing.locales.map((code) => (
          <option key={code} value={code}>
            {t(code)}
          </option>
        ))}
      </select>
    </label>
  );
}
