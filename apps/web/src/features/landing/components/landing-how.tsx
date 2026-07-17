import { getTranslations } from "next-intl/server";

const steps = ["01", "02", "03", "04"] as const;

export async function LandingHow() {
  const t = await getTranslations("Landing");

  return (
    <section id="how" className="scroll-mt-20 px-6 py-20">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {t("how.title")}
          </h2>
          <p className="mt-3 text-muted">{t("how.subtitle")}</p>
        </div>

        <ol className="relative mt-14 space-y-10">
          <div
            aria-hidden
            className="absolute top-4 bottom-4 left-5 w-px bg-border sm:left-6"
          />
          {steps.map((step, index) => (
            <li key={step} className="relative flex gap-5 sm:gap-6">
              <span className="relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-accent bg-background font-display text-sm font-bold text-accent sm:size-12 sm:text-base">
                {step}
              </span>
              <div className="pt-1.5">
                <h3 className="text-lg font-semibold text-foreground">
                  {t(`how.steps.${index}.title`)}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">
                  {t(`how.steps.${index}.body`)}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
