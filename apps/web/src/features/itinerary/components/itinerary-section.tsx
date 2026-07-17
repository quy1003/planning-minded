"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import type { DaySlot, ReorderItineraryInput } from "@tripmind/shared";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { InlineAlert } from "@/components/ui/inline-alert";
import { QueryError } from "@/components/ui/query-error";
import { SectionBlockSkeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { usePlaces } from "@/features/places/hooks";
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
import { ItineraryForm } from "./itinerary-form";
import { SortableSlotList } from "./sortable-slot-list";

type Props = { tripId: string; tripDays: number };

export function ItinerarySection({ tripId, tripDays }: Props) {
  const t = useTranslations("Itinerary");
  const { data: items = [], isLoading, isError, error, refetch } = useItinerary(tripId);
  const { data: places = [] } = usePlaces(tripId);
  const create = useCreateItineraryItem(tripId);
  const update = useUpdateItineraryItem(tripId);
  const del = useDeleteItineraryItem(tripId);
  const reorder = useReorderItinerary(tripId);

  const [editing, setEditing] = useState<ItineraryItem | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [reorderError, setReorderError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ItineraryItem | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const days = useMemo(
    () => Array.from({ length: tripDays }, (_, i) => i + 1),
    [tripDays],
  );

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
            setEditing(null);
            setFormKey((k) => k + 1);
          },
        },
      );
      return;
    }
    const visitOrder = nextVisitOrder(values.dayNumber, values.slot);
    create.mutate(toCreateItineraryInput(values, visitOrder), {
      onSuccess: () => setFormKey((k) => k + 1),
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
        setReorderError(err instanceof Error ? err.message : t("reorderFailed"));
      },
    });
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-medium text-zinc-900">{t("title")}</h2>
          <p className="text-sm text-zinc-600">{t("subtitle")}</p>
        </div>
        {reorder.isPending && (
          <span className="inline-flex items-center text-zinc-500" aria-busy>
            <Spinner label={t("saving")} />
          </span>
        )}
      </div>

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

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <div className="order-1 space-y-4 lg:order-1">
          {isLoading ? (
            <SectionBlockSkeleton rows={5} />
          ) : (
            days.map((day) => (
              <div
                key={day}
                className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50/80 shadow-sm"
              >
                <div className="border-b border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-800">
                  {t("dayLabel", { day })}
                </div>
                {DAY_SLOTS.map((slot) => {
                  const slotItems = items
                    .filter((item) => item.dayNumber === day && item.slot === slot)
                    .sort((a, b) => a.visitOrder - b.visitOrder);
                  return (
                    <div key={slot} className="border-b border-zinc-100 last:border-b-0">
                      <div className="bg-zinc-100/80 px-3 py-1.5 text-xs font-medium tracking-wide text-zinc-600 uppercase">
                        {t(`slots.${slot}`)}
                      </div>
                      <SortableSlotList
                        dayNumber={day}
                        slot={slot}
                        items={slotItems}
                        disabled={reorder.isPending || del.isPending}
                        deletingId={del.isPending ? pendingDelete?.id : undefined}
                        onReorder={(next) => handleGroupReorder(day, slot, next)}
                        onEdit={setEditing}
                        onDelete={(item) => {
                          setDeleteError(null);
                          setPendingDelete(item);
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="order-2 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm lg:sticky lg:top-4">
          <h3 className="mb-3 text-sm font-medium text-zinc-800">
            {editing ? t("editTitle") : t("addTitle")}
          </h3>
          <ItineraryForm
            key={editing?.id ?? `create-${formKey}`}
            mode={editing ? "edit" : "create"}
            places={places}
            tripDays={tripDays}
            initial={editing ?? undefined}
            isPending={editing ? update.isPending : create.isPending}
            error={editing ? update.error : create.error}
            onSubmit={handleSubmit}
            onCancelEdit={() => {
              setEditing(null);
              setFormKey((k) => k + 1);
            }}
          />
        </div>
      </div>

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
              if (editing?.id === item.id) {
                setEditing(null);
                setFormKey((k) => k + 1);
              }
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
