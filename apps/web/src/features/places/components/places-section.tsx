"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ButtonPending } from "@/components/ui/button-pending";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { InlineAlert } from "@/components/ui/inline-alert";
import { QueryError } from "@/components/ui/query-error";
import { SectionBlockSkeleton, Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api-client";
import {
  useCreatePlace,
  useDeletePlace,
  usePlaces,
  useUpdatePlace,
} from "../hooks";
import { toCreatePlaceInput, toUpdatePlaceInput, type PlaceFormValues } from "../place-form-schema";
import type { Place } from "../types";
import { PlaceForm } from "./place-form";

function MapLoading() {
  const t = useTranslations("Places");
  return (
    <div className="flex h-72 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-100 text-sm text-zinc-500 sm:h-80 lg:h-full lg:min-h-80">
      {t("mapLoading")}
    </div>
  );
}

const TripMap = dynamic(
  () => import("./trip-map").then((mod) => mod.TripMap),
  {
    ssr: false,
    loading: () => <MapLoading />,
  },
);

type Props = { tripId: string };

export function PlacesSection({ tripId }: Props) {
  const t = useTranslations("Places");
  const { data: places = [], isLoading, isError, error, refetch } = usePlaces(tripId);
  const create = useCreatePlace(tripId);
  const update = useUpdatePlace(tripId);
  const del = useDeletePlace(tripId);

  const [editing, setEditing] = useState<Place | null>(null);
  const [coordDraft, setCoordDraft] = useState<{ lat: number; lng: number } | null>(null);
  const [createFormKey, setCreateFormKey] = useState(0);
  const [pendingDelete, setPendingDelete] = useState<Place | null>(null);
  const [deleteConflict, setDeleteConflict] = useState<string | null>(null);

  const formPending = editing ? update.isPending : create.isPending;
  const formError = editing ? update.error : create.error;

  function handleSubmit(values: PlaceFormValues) {
    setDeleteConflict(null);
    if (editing) {
      update.mutate(
        { placeId: editing.id, body: toUpdatePlaceInput(values) },
        {
          onSuccess: () => {
            setEditing(null);
            setCoordDraft(null);
          },
        },
      );
      return;
    }
    create.mutate(toCreatePlaceInput(values), {
      onSuccess: () => {
        setCoordDraft(null);
        setCreateFormKey((key) => key + 1);
      },
    });
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-medium text-zinc-900">{t("title")}</h2>
        <p className="text-sm text-zinc-600">{t("subtitle")}</p>
      </div>

      {isError && (
        <QueryError
          message={error instanceof Error ? error.message : t("loadFailed")}
          onRetry={() => {
            void refetch();
          }}
        />
      )}

      {deleteConflict && (
        <InlineAlert variant="error" action={
          <button
            type="button"
            className="text-xs font-medium underline"
            onClick={() => setDeleteConflict(null)}
          >
            OK
          </button>
        }>
          {deleteConflict}
        </InlineAlert>
      )}

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <div className="order-1 min-h-0">
          {isLoading ? (
            <Skeleton className="h-72 w-full rounded-xl lg:min-h-80" />
          ) : (
            <TripMap
              places={places}
              draft={coordDraft}
              onMapClick={(coords) => setCoordDraft(coords)}
              className="h-72 w-full overflow-hidden rounded-xl border border-zinc-200 shadow-sm sm:h-80 lg:h-full lg:min-h-80"
            />
          )}
          <p className="mt-2 text-xs text-zinc-500">{t("mapHint")}</p>
        </div>

        <div className="order-2 space-y-4">
          <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-medium text-zinc-800">
              {editing ? t("editTitle") : t("addTitle")}
            </h3>
            <PlaceForm
              key={editing?.id ?? `create-${createFormKey}`}
              mode={editing ? "edit" : "create"}
              initial={editing ?? undefined}
              coordDraft={coordDraft}
              isPending={formPending}
              error={formError}
              onSubmit={handleSubmit}
              onCancelEdit={() => {
                setEditing(null);
                setCoordDraft(null);
              }}
            />
          </div>

          {isLoading ? (
            <SectionBlockSkeleton rows={3} />
          ) : (
            <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white shadow-sm">
              {places.length === 0 && (
                <li className="px-4 py-8 text-center text-sm text-zinc-500">{t("empty")}</li>
              )}
              {places.map((place, index) => (
                <li key={place.id} className="flex items-start justify-between gap-3 px-4 py-3">
                  <button
                    type="button"
                    className="min-w-0 flex-1 rounded-md text-left transition hover:bg-zinc-50"
                    onClick={() => {
                      setEditing(place);
                      setCoordDraft({
                        lat: Number.parseFloat(place.lat),
                        lng: Number.parseFloat(place.lng),
                      });
                    }}
                  >
                    <p className="truncate font-medium text-zinc-900">
                      <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-teal-800 text-[10px] text-white">
                        {index + 1}
                      </span>
                      {place.name}
                    </p>
                    <p className="truncate text-xs text-zinc-500">
                      {place.lat}, {place.lng}
                      {place.address ? ` · ${place.address}` : ""}
                    </p>
                  </button>
                  <button
                    type="button"
                    disabled={del.isPending}
                    aria-busy={del.isPending && pendingDelete?.id === place.id}
                    className="shrink-0 rounded-md px-1.5 py-1 text-sm text-red-700 transition hover:bg-red-50 disabled:opacity-60"
                    onClick={() => {
                      setDeleteConflict(null);
                      setPendingDelete(place);
                    }}
                  >
                    <ButtonPending
                      pending={del.isPending && pendingDelete?.id === place.id}
                    >
                      {t("delete")}
                    </ButtonPending>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title={t("deleteConfirmTitle")}
        description={
          pendingDelete ? t("deleteConfirm", { name: pendingDelete.name }) : undefined
        }
        confirmLabel={t("delete")}
        pending={del.isPending}
        onCancel={() => {
          if (!del.isPending) setPendingDelete(null);
        }}
        onConfirm={() => {
          if (!pendingDelete) return;
          const place = pendingDelete;
          del.mutate(place.id, {
            onSuccess: () => {
              if (editing?.id === place.id) {
                setEditing(null);
                setCoordDraft(null);
              }
              setPendingDelete(null);
            },
            onError: (err: unknown) => {
              setPendingDelete(null);
              if (err instanceof ApiError && err.status === 409) {
                setDeleteConflict(t("deleteConflict"));
              }
            },
          });
        }}
      />
    </section>
  );
}
