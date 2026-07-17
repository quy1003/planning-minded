"use client";

import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import type { DaySlot } from "@tripmind/shared";
import { MobileCollapsible } from "@/components/ui/mobile-collapsible";
import { SuccessDialog } from "@/components/ui/success-dialog";
import { DAY_SLOTS } from "@/features/itinerary/types";
import type { ItineraryItem } from "@/features/itinerary/types";
import type { Trip } from "../types";
import { DeleteTripButton } from "./delete-trip-button";
import { EditTripDialog } from "./edit-trip-dialog";

type Props = {
  trip: Trip;
  items: ItineraryItem[];
  placeCount: number;
};

function sumEstCost(items: ItineraryItem[]): number {
  return items.reduce((acc, item) => {
    const n = Number.parseFloat(item.estCost);
    return acc + (Number.isFinite(n) ? n : 0);
  }, 0);
}

function formatMoney(value: number, currency: string, locale: string): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency.length === 3 ? currency : "VND",
      maximumFractionDigits: currency === "VND" ? 0 : 2,
    }).format(value);
  } catch {
    return `${value} ${currency}`;
  }
}

function TripActions({
  tripId,
  title,
  editLabel,
  onEdit,
  compact,
}: {
  tripId: string;
  title: string;
  editLabel: string;
  onEdit: () => void;
  compact?: boolean;
}) {
  return (
    <div
      className={
        compact
          ? "flex flex-col gap-2 p-4 sm:flex-row"
          : "flex flex-col gap-2 sm:flex-row sm:items-stretch"
      }
    >
      <button
        type="button"
        className={
          compact
            ? "btn btn-primary btn-sm w-full sm:flex-1"
            : "btn btn-primary w-full sm:flex-1"
        }
        onClick={onEdit}
      >
        <PencilIcon />
        {editLabel}
      </button>
      <div
        className={
          compact
            ? "w-full sm:flex-1 [&_button]:btn-sm [&_button]:w-full"
            : "w-full sm:flex-1 [&_button]:w-full"
        }
      >
        <DeleteTripButton tripId={tripId} title={title} />
      </div>
    </div>
  );
}

export function TripSummarySidebar({ trip, items, placeCount }: Props) {
  const t = useTranslations("Trips");
  const tItinerary = useTranslations("Itinerary");
  const locale = useLocale();
  const [editOpen, setEditOpen] = useState(false);
  const [saveSuccessOpen, setSaveSuccessOpen] = useState(false);

  const plannedTotal = useMemo(() => sumEstCost(items), [items]);
  const bySlot = useMemo(() => {
    const map = {} as Record<DaySlot, number>;
    for (const slot of DAY_SLOTS) map[slot] = 0;
    for (const item of items) {
      const n = Number.parseFloat(item.estCost);
      if (Number.isFinite(n)) map[item.slot] += n;
    }
    return map;
  }, [items]);

  return (
    <aside className="flex flex-col gap-4">
      <div className="panel p-5 shadow-sm">
        <h2 className="font-display text-lg font-semibold text-foreground">
          {t("summary.explore", { destination: trip.destinationName })}
        </h2>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Stat label={t("summary.duration")} value={t("hero.days", { count: trip.days })} />
          <Stat label={t("summary.places")} value={t("hero.places", { count: placeCount })} />
          <Stat
            label={t("summary.activities")}
            value={t("hero.activities", { count: items.length })}
          />
          <Stat label={t("summary.party")} value={String(trip.partySize)} />
          <Stat label={t("summary.budget")} value={`${trip.budget} ${trip.currency}`} />
          <Stat
            label={t("summary.planned")}
            value={formatMoney(plannedTotal, trip.currency, locale)}
          />
        </div>

        <ul className="mt-5 space-y-2 border-t border-border pt-4 text-sm text-muted">
          <li className="flex justify-between gap-2">
            <span>{t("fields.startDate")}</span>
            <span className="text-foreground">{trip.startDate ?? "—"}</span>
          </li>
          <li className="flex justify-between gap-2">
            <span>{t("fields.status")}</span>
            <span className="text-foreground">{t(`status.${trip.status}`)}</span>
          </li>
        </ul>

        {/* Desktop: nút trong card như cũ */}
        <div className="mt-5 hidden lg:block">
          <TripActions
            tripId={trip.id}
            title={trip.title}
            editLabel={t("editSection")}
            onEdit={() => setEditOpen(true)}
          />
        </div>
      </div>

      {/* Mobile only: quản lý trip trong tab */}
      <div className="lg:hidden">
        <MobileCollapsible
          title={t("summary.manageTrip")}
          description={t("summary.manageTripHint")}
          defaultOpen={false}
        >
          <TripActions
            tripId={trip.id}
            title={trip.title}
            editLabel={t("editSection")}
            onEdit={() => setEditOpen(true)}
            compact
          />
        </MobileCollapsible>
      </div>

      {/* Chi phí: mobile accordion; desktop luôn mở (cùng component) */}
      <div className="lg:hidden">
        <MobileCollapsible
          title={t("summary.costBySlot")}
          description={t("summary.costBySlotHint")}
          defaultOpen={false}
        >
          <CostBySlot
            bySlot={bySlot}
            currency={trip.currency}
            locale={locale}
            hint={t("summary.costHint")}
            slotLabel={(slot) => tItinerary(`slots.${slot}`)}
            formatMoney={formatMoney}
          />
        </MobileCollapsible>
      </div>
      <div className="panel hidden p-5 shadow-sm lg:block">
        <h3 className="text-sm font-semibold text-foreground">{t("summary.costBySlot")}</h3>
        <CostBySlot
          bySlot={bySlot}
          currency={trip.currency}
          locale={locale}
          hint={t("summary.costHint")}
          slotLabel={(slot) => tItinerary(`slots.${slot}`)}
          formatMoney={formatMoney}
          className="mt-3"
        />
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
    </aside>
  );
}

function CostBySlot({
  bySlot,
  currency,
  locale,
  hint,
  slotLabel,
  formatMoney: format,
  className = "",
}: {
  bySlot: Record<DaySlot, number>;
  currency: string;
  locale: string;
  hint: string;
  slotLabel: (slot: DaySlot) => string;
  formatMoney: (value: number, currency: string, locale: string) => string;
  className?: string;
}) {
  return (
    <div className={`px-5 py-4 lg:px-0 lg:py-0 ${className}`}>
      <ul className="space-y-2.5 text-sm">
        {DAY_SLOTS.map((slot) => (
          <li key={slot} className="flex items-center justify-between gap-2 text-muted">
            <span>{slotLabel(slot)}</span>
            <span className="font-medium text-foreground">
              {format(bySlot[slot], currency, locale)}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted">{hint}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-background/80 px-3 py-2.5 dark:bg-white/5">
      <p className="text-[11px] font-medium tracking-wide text-muted uppercase">{label}</p>
      <p className="mt-0.5 truncate text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}
