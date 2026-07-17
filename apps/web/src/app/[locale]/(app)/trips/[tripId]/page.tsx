import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { TripDetail } from "@/features/trips/components/trip-detail";

type Props = {
  params: Promise<{ tripId: string }>;
};

export default async function TripDetailPage({ params }: Props) {
  const { tripId } = await params;
  const t = await getTranslations("Trips");

  return (
    <div className="space-y-5">
      <Link
        href="/trips"
        className="link-accent text-sm"
      >
        ← {t("backToList")}
      </Link>
      <TripDetail tripId={tripId} />
    </div>
  );
}
