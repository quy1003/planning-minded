import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CreateTripForm } from "@/features/trips/components/create-trip-form";

export default async function NewTripPage() {
  const t = await getTranslations("Trips");

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Link href="/trips" className="text-sm text-teal-800 hover:underline">
          ← {t("backToList")}
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">{t("newTitle")}</h1>
      </div>
      <CreateTripForm />
    </div>
  );
}
