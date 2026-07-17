import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { TripList } from "@/features/trips/components/trip-list";

export default async function TripsPage() {
  const t = await getTranslations("Trips");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <Link
          href="/trips/new"
          className="rounded-md bg-teal-800 px-4 py-2 text-sm font-medium text-white hover:bg-teal-900"
        >
          {t("newTrip")}
        </Link>
      </div>
      <TripList />
    </div>
  );
}
