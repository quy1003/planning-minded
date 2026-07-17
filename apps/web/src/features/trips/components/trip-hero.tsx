"use client";

import { useTranslations } from "next-intl";
import type { Trip } from "../types";

type Props = {
  trip: Trip;
};

/** Frame giống Landing CTA: soft accent → card. Hero chỉ hiện status (chi tiết ở sidebar). */
export function TripHero({ trip }: Props) {
  const t = useTranslations("Trips");

  return (
    <section className="rounded-3xl border border-border bg-gradient-to-b from-accent-soft to-card px-6 py-10 text-center sm:px-10 sm:py-12">
      <div className="mx-auto max-w-2xl">
        <p className="inline-flex items-center gap-1.5 text-sm font-medium text-muted">
          <svg viewBox="0 0 24 24" className="size-4 text-accent" fill="currentColor" aria-hidden>
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"
            />
          </svg>
          {trip.destinationName}
        </p>
        <h1 className="font-display mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {trip.title}
        </h1>
        <div className="mt-5 flex justify-center">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold tracking-wide ${statusChipClass(trip.status)}`}
          >
            {t(`status.${trip.status}`)}
          </span>
        </div>
      </div>
    </section>
  );
}

function statusChipClass(status: Trip["status"]): string {
  switch (status) {
    case "PLANNED":
      return "border border-accent/30 bg-accent-soft text-accent";
    case "COMPLETED":
      return "border border-success/30 bg-success-soft text-success-foreground";
    case "DRAFT":
    default:
      return "border border-border bg-surface/80 text-muted backdrop-blur";
  }
}
