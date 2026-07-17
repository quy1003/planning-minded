"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { QueryError } from "@/components/ui/query-error";
import { TripDetailSkeleton } from "@/components/ui/skeleton";
import { SuccessDialog } from "@/components/ui/success-dialog";
import { ItinerarySection } from "@/features/itinerary/components/itinerary-section";
import { PlacesSection } from "@/features/places/components/places-section";
import { ApiError } from "@/lib/api-client";
import { useTrip, useUpdateTrip } from "../hooks";
import { toUpdateTripInput } from "../trip-form-schema";
import { DeleteTripButton } from "./delete-trip-button";
import { TripForm } from "./trip-form";

type Props = { tripId: string };

export function TripDetail({ tripId }: Props) {
  const t = useTranslations("Trips");
  const { data: trip, isLoading, isError, error, refetch } = useTrip(tripId);
  const update = useUpdateTrip(tripId);
  const [saveSuccessOpen, setSaveSuccessOpen] = useState(false);

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
    <div className="space-y-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">{trip.title}</h1>
          <p className="text-zinc-600">{trip.destinationName}</p>
        </div>
        <DeleteTripButton tripId={trip.id} title={trip.title} />
      </div>

      <PlacesSection tripId={trip.id} />

      <ItinerarySection tripId={trip.id} tripDays={trip.days} />

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-zinc-900">{t("editSection")}</h2>
        <TripForm
          mode="edit"
          initial={trip}
          isPending={update.isPending}
          error={update.error}
          onSubmit={(values) =>
            update.mutate(toUpdateTripInput(values), {
              onSuccess: () => setSaveSuccessOpen(true),
            })
          }
        />
      </section>

      <SuccessDialog
        open={saveSuccessOpen}
        title={t("saveSuccessTitle")}
        description={t("saveSuccessBody")}
        onClose={() => setSaveSuccessOpen(false)}
      />
    </div>
  );
}
