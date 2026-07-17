import { getTranslations } from "next-intl/server";

const featureKeys = [
  "trips",
  "map",
  "itinerary",
  "dnd",
  "i18n",
  "aiSoon",
] as const;

const iconMeta: Record<(typeof featureKeys)[number], { glyph: string; className: string }> = {
  trips: { glyph: "T", className: "bg-blue-500/15 text-blue-500" },
  map: { glyph: "M", className: "bg-emerald-500/15 text-emerald-500" },
  itinerary: { glyph: "I", className: "bg-violet-500/15 text-violet-400" },
  dnd: { glyph: "D", className: "bg-orange-500/15 text-orange-500" },
  i18n: { glyph: "文", className: "bg-cyan-500/15 text-cyan-500" },
  aiSoon: { glyph: "AI", className: "bg-rose-500/15 text-rose-400" },
};

export async function LandingFeatures() {
  const t = await getTranslations("Landing");

  return (
    <section id="features" className="scroll-mt-20 px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {t("features.title")}
          </h2>
          <p className="mt-3 text-muted">{t("features.subtitle")}</p>
        </div>

        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featureKeys.map((key) => (
            <li
              key={key}
              className="rounded-2xl border border-border bg-card p-5 transition hover:bg-card-hover"
            >
              <span
                className={`mb-4 inline-flex size-10 items-center justify-center rounded-xl text-xs font-bold ${iconMeta[key].className}`}
              >
                {iconMeta[key].glyph}
              </span>
              <h3 className="text-base font-semibold text-foreground">
                {t(`features.items.${key}.title`)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {t(`features.items.${key}.body`)}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
