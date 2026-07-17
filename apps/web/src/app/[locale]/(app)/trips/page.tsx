import { getTranslations } from "next-intl/server";

export default async function TripsPage() {
  const t = await getTranslations("Trips");

  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="text-zinc-600">{t("placeholder")}</p>
      <div className="rounded-lg border border-dashed border-zinc-300 bg-white px-4 py-8 text-center text-sm text-zinc-500">
        {t("empty")}
      </div>
    </div>
  );
}
