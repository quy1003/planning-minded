import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { TripList } from "@/features/trips/components/trip-list";

export default async function TripsPage() {
  const t = await getTranslations("Trips");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <Link href="/trips/new" className="btn btn-primary">
          {t("newTrip")}
        </Link>
      </div>
      <TripList />
    </div>
  );
}
