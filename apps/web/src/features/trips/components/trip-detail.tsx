"use client";

import { useTranslations } from "next-intl";
import { ApiError } from "@/lib/api-client";
import { useTrip, useUpdateTrip } from "../hooks";
import { toUpdateTripInput } from "../trip-form-schema";
import { DeleteTripButton } from "./delete-trip-button";
import { TripForm } from "./trip-form";

type Props = { tripId: string };

export function TripDetail({ tripId }: Props) {
  const t = useTranslations("Trips");
  const { data: trip, isLoading, isError, error } = useTrip(tripId);
  const update = useUpdateTrip(tripId);

  if (isLoading) {
    return <p className="text-sm text-zinc-600">{t("loadingDetail")}</p>;
  }

  if (isError || !trip) {
    const message =
      error instanceof ApiError && error.status === 404
        ? t("notFound")
        : error instanceof Error
          ? error.message
          : t("loadFailed");
    return (
      <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
        {message}
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{trip.title}</h1>
          <p className="text-zinc-600">{trip.destinationName}</p>
        </div>
        <DeleteTripButton tripId={trip.id} title={trip.title} />
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">{t("editSection")}</h2>
        <TripForm
          mode="edit"
          initial={trip}
          isPending={update.isPending}
          error={update.error}
          onSubmit={(values) => update.mutate(toUpdateTripInput(values))}
        />
        {update.isSuccess && (
          <p className="text-sm text-teal-800">{t("saveSuccess")}</p>
        )}
      </section>

      <section className="rounded-lg border border-dashed border-zinc-300 bg-white px-4 py-6 text-sm text-zinc-500">
        {t("detailNextSlice")}
      </section>
    </div>
  );
}
