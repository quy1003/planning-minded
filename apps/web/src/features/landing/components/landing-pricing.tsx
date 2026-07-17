import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

const perks = ["perk1", "perk2", "perk3"] as const;

export async function LandingPricing() {
  const t = await getTranslations("Landing");

  return (
    <section id="pricing" className="scroll-mt-20 px-6 py-20">
      <div className="mx-auto max-w-xl text-center">
        <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          {t("pricing.title")}
        </h2>
        <p className="mt-3 text-muted">{t("pricing.subtitle")}</p>

        <div className="mt-10 rounded-2xl border border-border bg-card p-8 text-left shadow-sm">
          <p className="text-sm font-medium text-accent">{t("pricing.planLabel")}</p>
          <p className="mt-2 font-display text-4xl font-bold tracking-tight">
            {t("pricing.price")}
          </p>
          <p className="mt-2 text-sm text-muted">{t("pricing.priceHint")}</p>
          <ul className="mt-6 space-y-3 text-sm text-foreground">
            {perks.map((key) => (
              <li key={key} className="flex gap-2">
                <span className="mt-0.5 text-success" aria-hidden>
                  ✓
                </span>
                {t(`pricing.${key}`)}
              </li>
            ))}
          </ul>
          <Link
            href="/register"
            className="btn btn-primary mt-8 w-full"
          >
            {t("pricing.cta")}
          </Link>
        </div>
      </div>
    </section>
  );
}
