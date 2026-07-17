import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

const trusts = ["trust1", "trust2", "trust3"] as const;

export async function LandingCta() {
  const t = await getTranslations("Landing");

  return (
    <section className="px-6 pb-24">
      <div className="mx-auto max-w-4xl rounded-3xl border border-border bg-gradient-to-b from-accent-soft to-card px-6 py-14 text-center sm:px-12">
        <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          {t("cta.title")}
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-muted">{t("cta.subtitle")}</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/register"
            className="btn btn-primary w-full sm:w-auto"
          >
            {t("cta.primary")}
          </Link>
          <a
            href="#pricing"
            className="btn btn-secondary w-full sm:w-auto"
          >
            {t("cta.secondary")}
          </a>
        </div>
        <ul className="mt-8 flex flex-col items-center justify-center gap-3 text-sm text-muted sm:flex-row sm:gap-6">
          {trusts.map((key) => (
            <li key={key} className="inline-flex items-center gap-2">
              <span className="text-success" aria-hidden>
                ✓
              </span>
              {t(`cta.${key}`)}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
