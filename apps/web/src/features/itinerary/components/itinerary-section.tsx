"use client";

import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import type { DaySlot, ReorderItineraryInput } from "@tripmind/shared";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { InlineAlert } from "@/components/ui/inline-alert";
import { QueryError } from "@/components/ui/query-error";
import { SectionBlockSkeleton } from "@/components/ui/skeleton";
import { SuccessDialog } from "@/components/ui/success-dialog";
import { usePlaces } from "@/features/places/hooks";
import { formatTripDayDate } from "@/features/trips/lib/trip-dates";
import { ApiError } from "@/lib/api-client";
import {
  useCreateItineraryItem,
  useDeleteItineraryItem,
  useItinerary,
  useReorderItinerary,
  useUpdateItineraryItem,
} from "../hooks";
import {
  toCreateItineraryInput,
  toUpdateItineraryInput,
  type ItineraryFormValues,
} from "../itinerary-form-schema";
import { DAY_SLOTS, type ItineraryItem } from "../types";
import { ItineraryFormDialog } from "./itinerary-form-dialog";
import { SortableSlotList } from "./sortable-slot-list";

type Props = {
  tripId: string;
  tripDays: number;
  startDate: string | null;
  /** Giữ prop để không phá TripDetail — form luôn modal. */
  compact?: boolean;
};

export function ItinerarySection({ tripId, tripDays, startDate }: Props) {
  const t = useTranslations("Itinerary");
  const locale = useLocale();
  const { data: items = [], isLoading, isError, error, refetch } = useItinerary(tripId);
  const { data: places = [] } = usePlaces(tripId);
  const create = useCreateItineraryItem(tripId);
  const update = useUpdateItineraryItem(tripId);
  const del = useDeleteItineraryItem(tripId);
  const reorder = useReorderItinerary(tripId);

  const [editing, setEditing] = useState<ItineraryItem | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [createDay, setCreateDay] = useState(1);
  const [reorderError, setReorderError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ItineraryItem | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);
  const [successMode, setSuccessMode] = useState<"create" | "edit">("create");

  const days = useMemo(
    () => Array.from({ length: tripDays }, (_, i) => i + 1),
    [tripDays],
  );

  const formPending = editing ? update.isPending : create.isPending;
  const formError = editing ? update.error : create.error;
  const formMode = editing ? "edit" : "create";

  function closeForm() {
    if (formPending) return;
    setFormOpen(false);
    setEditing(null);
  }

  function finishSave(mode: "create" | "edit") {
    setFormOpen(false);
    setEditing(null);
    setSuccessMode(mode);
    setSuccessOpen(true);
  }

  function openCreate(day: number = 1) {
    setEditing(null);
    setCreateDay(day);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  }

  function openEdit(item: ItineraryItem) {
    setEditing(item);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  }

  function nextVisitOrder(dayNumber: number, slot: DaySlot): number {
    const inSlot = items.filter((item) => item.dayNumber === dayNumber && item.slot === slot);
    const max = inSlot.reduce((acc, item) => Math.max(acc, item.visitOrder), 0);
    return max + 1;
  }

  function handleSubmit(values: ItineraryFormValues) {
    setReorderError(null);
    setDeleteError(null);
    if (editing) {
      update.mutate(
        { itemId: editing.id, body: toUpdateItineraryInput(values) },
        {
          onSuccess: () => {
            finishSave("edit");
          },
        },
      );
      return;
    }
    const visitOrder = nextVisitOrder(values.dayNumber, values.slot);
    create.mutate(toCreateItineraryInput(values, visitOrder), {
      onSuccess: () => {
        finishSave("create");
      },
    });
  }

  function handleGroupReorder(dayNumber: number, slot: DaySlot, nextGroup: ItineraryItem[]) {
    setReorderError(null);
    const others = items.filter((item) => !(item.dayNumber === dayNumber && item.slot === slot));
    const merged = [...others, ...nextGroup];
    const body: ReorderItineraryInput = merged.map((item) => ({
      itemId: item.id,
      dayNumber: item.dayNumber,
      slot: item.slot,
      visitOrder: item.visitOrder,
    }));
    reorder.mutate(body, {
      onError: (err: unknown) => {
        if (err instanceof ApiError && err.status === 409) {
          setReorderError(t("conflictOrder"));
          return;
        }
        if (err instanceof ApiError && err.status === 422) {
          setReorderError(t("timeOrderConflict"));
          return;
        }
        setReorderError(err instanceof Error ? err.message : t("reorderFailed"));
      },
    });
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold text-foreground">{t("title")}</h2>
          <p className="text-sm text-muted">{t("subtitle")}</p>
        </div>
        <button
          type="button"
          className="btn btn-primary shrink-0"
          disabled={places.length === 0}
          title={places.length === 0 ? t("needPlaces") : undefined}
          onClick={() => openCreate()}
        >
          <PlusIcon />
          {t("addButton")}
        </button>
      </div>

      {places.length === 0 && (
        <InlineAlert variant="info">{t("needPlaces")}</InlineAlert>
      )}

      {isError && (
        <QueryError
          message={error instanceof Error ? error.message : t("loadFailed")}
          onRetry={() => {
            void refetch();
          }}
        />
      )}
      {reorderError && (
        <InlineAlert
          variant="error"
          action={
            <button
              type="button"
              className="text-xs font-medium underline"
              onClick={() => setReorderError(null)}
            >
              OK
            </button>
          }
        >
          {reorderError}
        </InlineAlert>
      )}
      {deleteError && (
        <InlineAlert
          variant="error"
          action={
            <button
              type="button"
              className="text-xs font-medium underline"
              onClick={() => setDeleteError(null)}
            >
              OK
            </button>
          }
        >
          {deleteError}
        </InlineAlert>
      )}

      <div className="space-y-8">
        {isLoading ? (
          <SectionBlockSkeleton rows={5} />
        ) : (
          days.map((day) => {
            const dateLabel = formatTripDayDate(startDate, day, locale);
            return (
              <div key={day} className="relative pl-6 sm:pl-8">
                <div
                  aria-hidden
                  className="absolute top-2 bottom-2 left-[7px] w-px bg-accent/40 sm:left-[9px]"
                />
                <div className="relative mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="absolute -left-6 flex size-4 items-center justify-center rounded-full border-2 border-accent bg-background sm:-left-8 sm:size-5">
                      <span className="size-1.5 rounded-full bg-accent sm:size-2" />
                    </span>
                    <h3 className="font-display text-base font-semibold text-foreground">
                      {t("dayLabel", { day })}
                      {dateLabel ? (
                        <span className="ml-2 text-sm font-normal text-muted">— {dateLabel}</span>
                      ) : null}
                    </h3>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm shrink-0"
                    disabled={places.length === 0}
                    title={places.length === 0 ? t("needPlaces") : undefined}
                    onClick={() => openCreate(day)}
                  >
                    <PlusIcon />
                    {t("addButton")}
                  </button>
                </div>

                <div className="space-y-5">
                  {DAY_SLOTS.map((slot) => {
                    const slotItems = items
                      .filter((item) => item.dayNumber === day && item.slot === slot)
                      .sort((a, b) => a.visitOrder - b.visitOrder);
                    if (slotItems.length === 0) return null;
                    return (
                      <div key={slot}>
                        <SortableSlotList
                          dayNumber={day}
                          slot={slot}
                          items={slotItems}
                          disabled={del.isPending}
                          deletingId={del.isPending ? pendingDelete?.id : undefined}
                          onReorder={(next) => handleGroupReorder(day, slot, next)}
                          onEdit={openEdit}
                          onDelete={(item) => {
                            setDeleteError(null);
                            setPendingDelete(item);
                          }}
                        />
                      </div>
                    );
                  })}
                  {DAY_SLOTS.every(
                    (slot) =>
                      !items.some((item) => item.dayNumber === day && item.slot === slot),
                  ) && (
                    <p className="rounded-xl border border-dashed border-border px-3 py-4 text-xs text-muted">
                      {t("emptyDay")}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <ItineraryFormDialog
        open={formOpen}
        mode={formMode}
        places={places}
        tripDays={tripDays}
        initial={editing ?? undefined}
        defaultDay={editing ? undefined : createDay}
        isPending={formPending}
        error={formError}
        formKey={editing?.id ?? `create-${formKey}`}
        onClose={closeForm}
        onSubmit={handleSubmit}
      />

      <SuccessDialog
        open={successOpen}
        title={
          successMode === "create" ? t("saveSuccessTitleCreate") : t("saveSuccessTitleUpdate")
        }
        description={t("saveSuccessBody")}
        onClose={() => setSuccessOpen(false)}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title={t("deleteConfirmTitle")}
        description={
          pendingDelete ? t("deleteConfirm", { title: pendingDelete.title }) : undefined
        }
        confirmLabel={t("delete")}
        pending={del.isPending}
        onCancel={() => {
          if (!del.isPending) setPendingDelete(null);
        }}
        onConfirm={() => {
          if (!pendingDelete) return;
          const item = pendingDelete;
          del.mutate(item.id, {
            onSuccess: () => {
              if (editing?.id === item.id) closeForm();
              setPendingDelete(null);
            },
            onError: (err: unknown) => {
              setPendingDelete(null);
              setDeleteError(err instanceof Error ? err.message : t("deleteFailed"));
            },
          });
        }}
      />
    </section>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
