import { getTranslations } from "next-intl/server";
import { BrandMark } from "@/components/brand-mark";
import { Link } from "@/i18n/navigation";

export async function LandingFooter() {
  const t = await getTranslations("Landing");
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border px-6 py-12">
      <div className="mx-auto grid max-w-6xl gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <BrandMark />
          <p className="mt-3 max-w-xs text-sm text-muted">{t("footer.blurb")}</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{t("footer.product")}</p>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>
              <a href="#features" className="hover:text-foreground">
                {t("nav.features")}
              </a>
            </li>
            <li>
              <a href="#how" className="hover:text-foreground">
                {t("nav.how")}
              </a>
            </li>
            <li>
              <a href="#pricing" className="hover:text-foreground">
                {t("nav.pricing")}
              </a>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{t("footer.account")}</p>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>
              <Link href="/login" className="hover:text-foreground">
                {t("nav.signIn")}
              </Link>
            </li>
            <li>
              <Link href="/register" className="hover:text-foreground">
                {t("nav.getStarted")}
              </Link>
            </li>
            <li>
              <Link href="/trips" className="hover:text-foreground">
                {t("footer.trips")}
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{t("footer.learn")}</p>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>
              <span>{t("footer.phase1")}</span>
            </li>
            <li>
              <span>{t("footer.stack")}</span>
            </li>
          </ul>
        </div>
      </div>
      <div className="mx-auto mt-10 flex max-w-6xl flex-col gap-2 border-t border-border pt-6 text-xs text-muted sm:flex-row sm:justify-between">
        <p>
          © {year} TripMind. {t("footer.rights")}
        </p>
        <p>{t("footer.note")}</p>
      </div>
    </footer>
  );
}
