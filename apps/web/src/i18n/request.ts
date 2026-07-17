import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import en from "../../messages/en.json";
import vi from "../../messages/vi.json";
import { routing, type AppLocale } from "./routing";

const catalogs: Record<AppLocale, typeof vi> = { vi, en };

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? (requested as AppLocale)
    : routing.defaultLocale;

  return {
    locale,
    // Import tĩnh — Turbopack không “kẹt” bản messages cũ như dynamic import().
    messages: catalogs[locale],
  };
});
