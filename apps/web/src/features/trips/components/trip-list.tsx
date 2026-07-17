"use client";

import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { QueryError } from "@/components/ui/query-error";
import { TripListSkeleton } from "@/components/ui/skeleton";
import { SuccessDialog } from "@/components/ui/success-dialog";
import { Link } from "@/i18n/navigation";
import { formatMoney } from "@/lib/format-money";
import { useTrips } from "../hooks";
import { groupTripsByYear } from "../lib/group-trips-by-year";
import { tripCoverColorIndex, tripCoverIconIndex } from "../lib/trip-cover";
import type { Trip } from "../types";
import { CreateTripButton } from "./create-trip-button";
import { DeleteTripButton } from "./delete-trip-button";
import { EditTripDialog } from "./edit-trip-dialog";
import { TripStatusBadge } from "./trip-status-badge";

/** "2026-07-17" → "17 thg 7" (vi) / "Jul 17" (en) — năm đã có ở tiêu đề nhóm nên không lặp lại. */
function formatShortDate(startDate: string | null, locale: string): string | null {
  if (!startDate) return null;
  const date = new Date(startDate);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(date);
}

export function TripList() {
  const t = useTranslations("Trips");
  const locale = useLocale();
  const { data: trips, isLoading, isError, error, refetch, isFetching } = useTrips();
  const yearGroups = useMemo(() => groupTripsByYear(trips ?? []), [trips]);

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
      <div className="panel border-dashed px-4 py-12 text-center">
        <p className="text-sm text-muted">{t("empty")}</p>
        <CreateTripButton className="btn btn-primary mt-4">{t("createFirst")}</CreateTripButton>
      </div>
    );
  }

  return (
    <div className={`space-y-8 transition-opacity ${isFetching ? "opacity-70" : ""}`}>
      {yearGroups.map((group) => (
        <section key={group.year ?? "unscheduled"} className="space-y-3">
          <div className="flex items-baseline gap-2">
            <h2 className="font-display text-lg font-semibold text-foreground">
              {group.year ?? t("list.unscheduledYear")}
            </h2>
            <span className="rounded-full border border-border bg-surface px-2.5 py-0.5 text-xs text-muted">
              {group.trips.length}
            </span>
          </div>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {group.trips.map((trip) => (
              <TripListItem key={trip.id} trip={trip} locale={locale} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function TripListItem({ trip, locale }: { trip: Trip; locale: string }) {
  const t = useTranslations("Trips");
  const [editOpen, setEditOpen] = useState(false);
  const [saveSuccessOpen, setSaveSuccessOpen] = useState(false);

  const shortDate = formatShortDate(trip.startDate, locale);
  const metaLine = [trip.destinationName, shortDate, `${trip.days} ${t("daysShort")}`]
    .filter(Boolean)
    .join(" · ");
  const budgetText = formatMoney(Number.parseFloat(trip.budget), trip.currency, locale);
  const partyText = t("list.partyCount", { count: trip.partySize });

  const coverClass = COVER_CLASSES[tripCoverColorIndex(trip.id)] ?? COVER_CLASSES[0];
  const CoverIcon = COVER_ICONS[tripCoverIconIndex(trip.id)] ?? SunIcon;

  return (
    <li className="flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition hover:shadow-lg">
      <div className={`${coverClass} relative flex h-[5.5rem] items-center justify-center`}>
        <CoverIcon />
        <TripStatusBadge status={trip.status} variant="frosted" className="absolute top-2.5 right-2.5" />
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <div className="min-w-0">
          <p className="font-display truncate text-lg font-bold text-foreground">{trip.title}</p>
          <p className="mt-0.5 flex items-center gap-1 truncate text-sm text-muted">
            <PinIcon />
            {metaLine}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent">
            <WalletIcon />
            {budgetText}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-border/60 px-2.5 py-1 text-xs font-semibold text-foreground">
            <UsersIcon />
            {partyText}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 border-t border-border p-3">
        <Link
          href={`/trips/${trip.id}`}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-bold text-white transition hover:bg-accent-hover"
        >
          <EyeIcon />
          {t("list.viewDetail")}
        </Link>
        <button
          type="button"
          aria-label={`${t("editSection")} ${trip.title}`}
          className="inline-flex size-8 items-center justify-center rounded-full bg-muted/10 text-muted transition hover:bg-accent-soft hover:text-accent"
          onClick={() => setEditOpen(true)}
        >
          <PencilIcon />
        </button>
        <DeleteTripButton tripId={trip.id} title={trip.title} variant="icon" />
      </div>

      <EditTripDialog
        trip={trip}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={() => setSaveSuccessOpen(true)}
      />
      <SuccessDialog
        open={saveSuccessOpen}
        title={t("saveSuccessTitle")}
        description={t("saveSuccessBody")}
        onClose={() => setSaveSuccessOpen(false)}
      />
    </li>
  );
}

/**
 * Class cover PHẢI viết đủ chữ (không ghép chuỗi `trip-cover-${i}`) — Tailwind chỉ sinh CSS
 * cho class nó thấy nguyên vẹn lúc build, ghép chuỗi runtime sẽ làm nó "biến mất" (không render được).
 */
const COVER_CLASSES = [
  "trip-cover-0",
  "trip-cover-1",
  "trip-cover-2",
  "trip-cover-3",
  "trip-cover-4",
  "trip-cover-5",
];

/** 6 icon trang trí cover — index chọn bởi hash(tripId), không mang ý nghĩa category thật. */
const COVER_ICONS = [SunIcon, ForestIcon, BloomIcon, LanternIcon, WaveIcon, StarIcon];

function SunIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" className="size-10 drop-shadow-[0_2px_6px_rgba(0,0,0,0.15)]" aria-hidden>
      <circle cx="24" cy="19" r="8" fill="#fff" fillOpacity="0.92" />
      <path d="M4 34c4-6 10-9 20-9s16 3 20 9" stroke="#fff" strokeOpacity="0.85" strokeWidth="4" strokeLinecap="round" />
      <path d="M8 40c4-4.5 9-6.5 16-6.5s12 2 16 6.5" stroke="#fff" strokeOpacity="0.55" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

function ForestIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" className="size-10 drop-shadow-[0_2px_6px_rgba(0,0,0,0.15)]" aria-hidden>
      <path d="M15 30 22 14l7 16z" fill="#fff" fillOpacity="0.92" />
      <path d="M26 33 34 15l8 18z" fill="#fff" fillOpacity="0.65" />
      <circle cx="12" cy="16" r="4.5" fill="#fff" fillOpacity="0.9" />
    </svg>
  );
}

function BloomIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" className="size-10 drop-shadow-[0_2px_6px_rgba(0,0,0,0.15)]" aria-hidden>
      <g fill="#fff" fillOpacity="0.92">
        <circle cx="24" cy="14" r="7" />
        <circle cx="24" cy="34" r="7" />
        <circle cx="14" cy="24" r="7" />
        <circle cx="34" cy="24" r="7" />
      </g>
      <circle cx="24" cy="24" r="5.5" fill="#fff" />
    </svg>
  );
}

function LanternIcon() {
  return (
    <svg viewBox="0 0 40 48" fill="none" className="size-9 drop-shadow-[0_2px_6px_rgba(0,0,0,0.15)]" aria-hidden>
      <rect x="8" y="12" width="24" height="26" rx="10" fill="#fff" fillOpacity="0.92" />
      <rect x="16" y="4" width="8" height="8" rx="2" fill="#fff" fillOpacity="0.75" />
      <rect x="16" y="38" width="8" height="7" rx="2" fill="#fff" fillOpacity="0.75" />
      <path d="M8 25h24" stroke="#E2694A" strokeOpacity="0.35" strokeWidth="2" />
    </svg>
  );
}

function WaveIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" className="size-10 drop-shadow-[0_2px_6px_rgba(0,0,0,0.15)]" aria-hidden>
      <path
        d="M4 20c4-5 10-5 14 0s10 5 14 0 10-5 14 0"
        stroke="#fff"
        strokeOpacity="0.92"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M4 32c4-5 10-5 14 0s10 5 14 0 10-5 14 0"
        stroke="#fff"
        strokeOpacity="0.55"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" className="size-10 drop-shadow-[0_2px_6px_rgba(0,0,0,0.15)]" aria-hidden>
      <path
        d="M24 6l5.5 11.6L42 19.4l-9 9 2.2 12.6L24 35.2l-11.2 5.8L15 28.4l-9-9 12.5-1.8z"
        fill="#fff"
        fillOpacity="0.92"
      />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-3.5 shrink-0" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"
      />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="2.5" y="6" width="19" height="13" rx="3" />
      <path d="M2.5 10.5h19M16 14.2h2" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="9" cy="8" r="3" />
      <path d="M2.5 19c0-3 2.9-5 6.5-5s6.5 2 6.5 5" />
      <circle cx="17.5" cy="9" r="2.4" />
      <path d="M15.8 14.2c2.7.4 4.7 2 4.7 4.8" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}
