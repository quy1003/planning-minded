"use client";

import type { Trip } from "../types";
import { TripStatusBadge } from "./trip-status-badge";

type Props = {
  trip: Trip;
};

/** Frame giống Landing CTA: soft accent → card. Hero chỉ hiện status (chi tiết ở sidebar). */
export function TripHero({ trip }: Props) {
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
          <TripStatusBadge status={trip.status} />
        </div>
      </div>
    </section>
  );
}
