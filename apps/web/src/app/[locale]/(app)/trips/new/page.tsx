import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CreateTripForm } from "@/features/trips/components/create-trip-form";

export default async function NewTripPage() {
  const t = await getTranslations("Trips");

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Link href="/trips" className="link-accent text-sm">
          ← {t("backToList")}
        </Link>
        <h1 className="font-display text-2xl font-semibold tracking-tight">{t("newTitle")}</h1>
      </div>
      <div className="panel p-5 shadow-sm sm:p-6">
        <CreateTripForm />
      </div>
    </div>
  );
}
