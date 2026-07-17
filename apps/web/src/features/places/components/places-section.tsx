"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useState } from "react";
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

const TripMap = dynamic(
  () => import("./trip-map").then((mod) => mod.TripMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-72 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-100 text-sm text-zinc-500">
        Map…
      </div>
    ),
  },
);

type Props = { tripId: string };

export function PlacesSection({ tripId }: Props) {
  const t = useTranslations("Places");
  const { data: places = [], isLoading, isError, error } = usePlaces(tripId);
  const create = useCreatePlace(tripId);
  const update = useUpdatePlace(tripId);
  const del = useDeletePlace(tripId);

  const [editing, setEditing] = useState<Place | null>(null);
  const [coordDraft, setCoordDraft] = useState<{ lat: number; lng: number } | null>(null);
  const [createFormKey, setCreateFormKey] = useState(0);

  const formPending = editing ? update.isPending : create.isPending;
  const formError = editing ? update.error : create.error;

  function handleSubmit(values: PlaceFormValues) {
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
        <h2 className="text-lg font-medium">{t("title")}</h2>
        <p className="text-sm text-zinc-600">{t("subtitle")}</p>
      </div>

      {isLoading && <p className="text-sm text-zinc-600">{t("loading")}</p>}
      {isError && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error instanceof Error ? error.message : t("loadFailed")}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <TripMap
          places={places}
          draft={coordDraft}
          onMapClick={(coords) => setCoordDraft(coords)}
          className="h-80 w-full overflow-hidden rounded-lg border border-zinc-200 lg:h-full lg:min-h-80"
        />

        <div className="space-y-4">
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
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

          <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
            {places.length === 0 && !isLoading && (
              <li className="px-4 py-6 text-center text-sm text-zinc-500">{t("empty")}</li>
            )}
            {places.map((place, index) => (
              <li key={place.id} className="flex items-start justify-between gap-3 px-4 py-3">
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
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
                  className="shrink-0 text-sm text-red-700 hover:underline disabled:opacity-60"
                  onClick={() => {
                    if (window.confirm(t("deleteConfirm", { name: place.name }))) {
                      del.mutate(place.id, {
                        onSuccess: () => {
                          if (editing?.id === place.id) {
                            setEditing(null);
                            setCoordDraft(null);
                          }
                        },
                        onError: (err: unknown) => {
                          if (err instanceof ApiError && err.status === 409) {
                            window.alert(t("deleteConflict"));
                          }
                        },
                      });
                    }
                  }}
                >
                  {t("delete")}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
