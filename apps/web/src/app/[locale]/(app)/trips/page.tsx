import { getTranslations } from "next-intl/server";
import { CreateTripButton } from "@/features/trips/components/create-trip-button";
import { TripList } from "@/features/trips/components/trip-list";

export default async function TripsPage() {
  const t = await getTranslations("Trips");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <CreateTripButton className="btn btn-primary">{t("newTrip")}</CreateTripButton>
      </div>
      <TripList />
    </div>
  );
}
