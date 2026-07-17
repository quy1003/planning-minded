"use client";

import { useTranslations } from "next-intl";
import { QueryError } from "@/components/ui/query-error";
import { TripDetailSkeleton } from "@/components/ui/skeleton";
import { ItinerarySection } from "@/features/itinerary/components/itinerary-section";
import { useItinerary } from "@/features/itinerary/hooks";
import { PlacesSection } from "@/features/places/components/places-section";
import { usePlaces } from "@/features/places/hooks";
import { ApiError } from "@/lib/api-client";
import { useTrip } from "../hooks";
import { TripHero } from "./trip-hero";
import { TripSummarySidebar } from "./trip-summary-sidebar";

type Props = { tripId: string };

/**
 * Mobile: một cột flex gap-4 đều (Summary tabs + Map + Itinerary).
 * Desktop: grid 2 cột; `lg:contents` để Summary/Map tham gia grid cha.
 */
export function TripDetail({ tripId }: Props) {
  const t = useTranslations("Trips");
  const { data: trip, isLoading, isError, error, refetch } = useTrip(tripId);
  const { data: places = [] } = usePlaces(tripId);
  const { data: items = [] } = useItinerary(tripId);

  if (isLoading) {
    return <TripDetailSkeleton />;
  }

  if (isError || !trip) {
    const message =
      error instanceof ApiError && error.status === 404
        ? t("notFound")
        : error instanceof Error
          ? error.message
          : t("loadFailed");
    return (
      <QueryError
        message={message}
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(260px,320px)] lg:items-start lg:gap-8">
      <div className="lg:col-span-full">
        <TripHero trip={trip} />
      </div>

      {/*
        Mobile: flex gap-4 — khoảng cách tab Summary ↔ Map đều.
        Desktop: contents — Summary/Places trở thành ô lưới của cha.
      */}
      <div className="flex flex-col gap-4 lg:contents">
        <aside className="lg:col-start-2 lg:row-start-3 lg:self-start lg:top-20">
          <TripSummarySidebar trip={trip} items={items} placeCount={places.length} />
        </aside>

        <div className="lg:col-span-full">
          <PlacesSection tripId={trip.id} />
        </div>
      </div>

      <div className="lg:col-start-1 lg:row-start-3">
        <ItinerarySection
          tripId={trip.id}
          tripDays={trip.days}
          startDate={trip.startDate}
          compact
        />
      </div>
    </div>
  );
}
