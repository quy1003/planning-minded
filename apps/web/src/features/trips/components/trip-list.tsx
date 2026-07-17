"use client";

import { useTranslations } from "next-intl";
import { QueryError } from "@/components/ui/query-error";
import { TripListSkeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { useTrips } from "../hooks";

export function TripList() {
  const t = useTranslations("Trips");
  const { data: trips, isLoading, isError, error, refetch, isFetching } = useTrips();

  if (isLoading) {
    return <TripListSkeleton />;
  }

  if (isError) {
    return (
      <QueryError
        message={error instanceof Error ? error.message : t("loadFailed")}
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  if (!trips || trips.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 bg-white px-4 py-12 text-center">
        <p className="text-sm text-zinc-600">{t("empty")}</p>
        <Link
          href="/trips/new"
          className="mt-4 inline-flex rounded-md bg-teal-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-900"
        >
          {t("createFirst")}
        </Link>
      </div>
    );
  }

  return (
    <ul
      className={`divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white shadow-sm transition-opacity ${
        isFetching ? "opacity-70" : ""
      }`}
    >
      {trips.map((trip) => (
        <li key={trip.id}>
          <Link
            href={`/trips/${trip.id}`}
            className="flex items-start justify-between gap-4 px-4 py-3.5 transition hover:bg-zinc-50 active:bg-zinc-100"
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
