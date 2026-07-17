"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type AppLocale } from "@/i18n/routing";

/** Mobile: VI / EN. Desktop: tên đầy đủ. */
export function LocaleSwitcher() {
  const t = useTranslations("Locale");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <label className="flex items-center text-sm text-muted">
      <span className="sr-only">{t("label")}</span>
      <select
        className="h-9 max-w-[7.5rem] rounded-lg border border-border bg-surface px-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-ring sm:max-w-none sm:px-2.5"
        value={locale}
        aria-label={t("label")}
        onChange={(event) => {
          const next = event.target.value as AppLocale;
          router.replace(pathname, { locale: next });
        }}
      >
        {routing.locales.map((code) => (
          <option key={code} value={code}>
            {/* option không responsive CSS được — dùng mã ngắn gọn */}
            {code.toUpperCase()}
          </option>
        ))}
      </select>
    </label>
  );
}
