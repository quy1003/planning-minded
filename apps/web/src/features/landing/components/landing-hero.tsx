import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function LandingHero() {
  const t = await getTranslations("Landing");

  return (
    <section className="relative overflow-hidden px-6 pb-20 pt-16 sm:pt-24">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-[28rem] max-w-3xl bg-[radial-gradient(ellipse_at_center,var(--hero-glow),transparent_70%)]"
      />

      <div className="relative mx-auto max-w-3xl text-center">
        <p className="inline-flex items-center rounded-full border border-border bg-surface/80 px-3 py-1 text-xs font-medium text-muted backdrop-blur">
          {t("hero.badge")}
        </p>

        <h1 className="mt-6 font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
          {t("hero.titleBefore")}{" "}
          <span className="bg-gradient-to-r from-accent to-sky-400 bg-clip-text text-transparent">
            {t("hero.titleHighlight")}
          </span>
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-base text-muted sm:text-lg">{t("hero.subtitle")}</p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/register"
            className="btn btn-primary w-full shadow-lg shadow-accent/25 sm:w-auto"
          >
            {t("hero.ctaPrimary")}
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
          </Link>
          <a
            href="#how"
            className="btn btn-secondary w-full sm:w-auto"
          >
            {t("hero.ctaSecondary")}
          </a>
        </div>

        <p className="mt-6 text-sm text-muted">{t("hero.socialProof")}</p>
      </div>
    </section>
  );
}
