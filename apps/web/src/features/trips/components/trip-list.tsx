"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useTrips } from "../hooks";

export function TripList() {
  const t = useTranslations("Trips");
  const { data: trips, isLoading, isError, error } = useTrips();

  if (isLoading) {
    return <p className="text-sm text-zinc-600">{t("loadingList")}</p>;
  }

  if (isError) {
    return (
      <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
        {error instanceof Error ? error.message : t("loadFailed")}
      </p>
    );
  }

  if (!trips || trips.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 bg-white px-4 py-10 text-center">
        <p className="text-sm text-zinc-600">{t("empty")}</p>
        <Link
          href="/trips/new"
          className="mt-4 inline-flex rounded-md bg-teal-800 px-4 py-2 text-sm font-medium text-white hover:bg-teal-900"
        >
          {t("createFirst")}
        </Link>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
      {trips.map((trip) => (
        <li key={trip.id}>
          <Link
            href={`/trips/${trip.id}`}
            className="flex items-start justify-between gap-4 px-4 py-3 transition hover:bg-zinc-50"
          >
            <div className="min-w-0">
              <p className="truncate font-medium text-zinc-900">{trip.title}</p>
              <p className="truncate text-sm text-zinc-600">
                {trip.destinationName}
                {trip.startDate ? ` · ${trip.startDate}` : ""}
              </p>
            </div>
            <div className="shrink-0 text-right text-xs text-zinc-500">
              <p>{t(`status.${trip.status}`)}</p>
              <p className="mt-1">
                {trip.days} {t("daysShort")} · {trip.budget} {trip.currency}
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
