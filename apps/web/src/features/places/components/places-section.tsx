"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ButtonPending } from "@/components/ui/button-pending";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { InlineAlert } from "@/components/ui/inline-alert";
import { MobileCollapsible } from "@/components/ui/mobile-collapsible";
import { QueryError } from "@/components/ui/query-error";
import { SectionBlockSkeleton, Skeleton } from "@/components/ui/skeleton";
import { SuccessDialog } from "@/components/ui/success-dialog";
import { ApiError } from "@/lib/api-client";
import { useItinerary } from "@/features/itinerary/hooks";
import {
  useCreatePlace,
  useDeletePlace,
  usePlaces,
  useUpdatePlace,
} from "../hooks";
import { toCreatePlaceInput, toUpdatePlaceInput, type PlaceFormValues } from "../place-form-schema";
import type { Place } from "../types";
import { PlaceFormDialog } from "./place-form-dialog";

function MapLoading() {
  const t = useTranslations("Places");
  return (
    <div className="flex h-full min-h-[240px] items-center justify-center bg-muted/20 text-sm text-muted lg:min-h-[480px]">
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

type Props = { tripId: string; tripDays: number };

/** Tab map: số ngày | "all" = mọi địa điểm không polyline. */
type MapDayTab = number | "all";

type MapMode = "idle" | "create" | "relocate";

/**
 * Create: Thêm → pick map → modal.
 * Edit: ✎ → modal ngay (sửa tên/địa chỉ). Muốn đổi vị trí → “Đổi vị trí trên bản đồ”.
 */
export function PlacesSection({ tripId, tripDays }: Props) {
  const t = useTranslations("Places");
  const { data: places = [], isLoading, isError, error, refetch } = usePlaces(tripId);
  // Cùng query key với ItinerarySection → TanStack cache, không gọi API thừa.
  const { data: itineraryItems = [] } = useItinerary(tripId);
  const create = useCreatePlace(tripId);
  const update = useUpdatePlace(tripId);
  const del = useDeletePlace(tripId);

  const [editing, setEditing] = useState<Place | null>(null);
  const [coordDraft, setCoordDraft] = useState<{ lat: number; lng: number } | null>(null);
  const [textDraft, setTextDraft] = useState<{ name: string; address: string } | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [pendingDelete, setPendingDelete] = useState<Place | null>(null);
  const [deleteConflict, setDeleteConflict] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [mapMode, setMapMode] = useState<MapMode>("idle");
  const [successOpen, setSuccessOpen] = useState(false);
  const [successMode, setSuccessMode] = useState<"create" | "edit">("create");
  /** Place đang được focus trên map (click list). */
  const [focusPlaceId, setFocusPlaceId] = useState<string | null>(null);
  const [mapDayTab, setMapDayTab] = useState<MapDayTab>(1);

  const formPending = editing ? update.isPending : create.isPending;
  const formError = editing ? update.error : create.error;
  const formMode = editing ? "edit" : "create";
  const pickingOnMap = mapMode === "create" || mapMode === "relocate";

  const dayCount = Math.max(1, tripDays);
  /** Lúc pick: hiện mọi place, tắt route. Tab ngày: filterDay = số. Tab all: null. */
  const filterDay = pickingOnMap || mapDayTab === "all" ? null : mapDayTab;
  const showRoutes = !pickingOnMap && mapDayTab !== "all";

  function exitMapMode() {
    if (mapMode === "relocate" && editing) {
      // Hủy relocation → mở lại form với tọa độ cũ, giữ textDraft.
      setMapMode("idle");
      setCoordDraft({
        lat: Number.parseFloat(editing.lat),
        lng: Number.parseFloat(editing.lng),
      });
      setFormKey((k) => k + 1);
      setFormOpen(true);
      return;
    }
    setMapMode("idle");
    if (!formOpen) {
      setCoordDraft(null);
      setEditing(null);
      setTextDraft(null);
    }
  }

  function closeForm() {
    if (formPending) return;
    setFormOpen(false);
    setEditing(null);
    setCoordDraft(null);
    setTextDraft(null);
    setMapMode("idle");
  }

  function startCreateMode() {
    setEditing(null);
    setTextDraft(null);
    setFormOpen(false);
    setCoordDraft(null);
    setMapMode("create");
  }

  /** ✎ → mở modal ngay, không bắt chọn lại map. */
  function openEdit(place: Place) {
    setFocusPlaceId(place.id);
    setMapMode("idle");
    setEditing(place);
    setTextDraft(null);
    setCoordDraft({
      lat: Number.parseFloat(place.lat),
      lng: Number.parseFloat(place.lng),
    });
    setFormKey((k) => k + 1);
    setFormOpen(true);
  }

  function focusPlace(place: Place) {
    setFocusPlaceId(place.id);
    // Place không thuộc ngày đang xem → chuyển tab “Tất cả” để marker hiện được.
    if (typeof mapDayTab === "number") {
      const onDay = itineraryItems.some(
        (item) => item.placeId === place.id && item.dayNumber === mapDayTab,
      );
      if (!onDay) setMapDayTab("all");
    }
  }

  /** Từ modal edit: tạm đóng → pick map (giữ name/address đang gõ). */
  function startRelocate(draft: { name: string; address: string }) {
    if (!editing) return;
    setTextDraft(draft);
    setFormOpen(false);
    setCoordDraft({
      lat: Number.parseFloat(editing.lat),
      lng: Number.parseFloat(editing.lng),
    });
    setMapMode("relocate");
  }

  function openFormFromMap(coords: { lat: number; lng: number }) {
    setCoordDraft(coords);
    setMapMode("idle");
    setFormKey((k) => k + 1);
    setFormOpen(true);
  }

  function finishSave(mode: "create" | "edit") {
    setFormOpen(false);
    setEditing(null);
    setCoordDraft(null);
    setTextDraft(null);
    setMapMode("idle");
    setSuccessMode(mode);
    setSuccessOpen(true);
  }

  function handleSubmit(values: PlaceFormValues) {
    setDeleteConflict(null);
    if (editing) {
      update.mutate(
        { placeId: editing.id, body: toUpdatePlaceInput(values) },
        {
          onSuccess: () => finishSave("edit"),
        },
      );
      return;
    }
    create.mutate(toCreatePlaceInput(values), {
      onSuccess: () => finishSave("create"),
    });
  }

  return (
    <section className="flex flex-col gap-4">
      {isError && (
        <QueryError
          message={error instanceof Error ? error.message : t("loadFailed")}
          onRetry={() => {
            void refetch();
          }}
        />
      )}

      {deleteConflict && (
        <InlineAlert
          variant="error"
          action={
            <button
              type="button"
              className="text-xs font-medium underline"
              onClick={() => setDeleteConflict(null)}
            >
              OK
            </button>
          }
        >
          {deleteConflict}
        </InlineAlert>
      )}

      {pickingOnMap && (
        <InlineAlert
          variant="info"
          action={
            <button type="button" className="btn btn-secondary btn-sm" onClick={exitMapMode}>
              {t("cancelEdit")}
            </button>
          }
        >
          {mapMode === "relocate"
            ? t("editModeHint", { name: editing?.name ?? "" })
            : t("createModeHint")}
        </InlineAlert>
      )}

      <MobileCollapsible
        title={t("mapEditorTitle")}
        description={t("mapEditorHint", { count: places.length })}
        defaultOpen={false}
      >
        <div
          className={`overflow-hidden lg:rounded-2xl lg:border lg:bg-card lg:shadow-sm ${
            pickingOnMap
              ? "ring-2 ring-inset ring-accent/30 lg:border-accent lg:ring-accent/30"
              : "lg:border-border"
          }`}
        >
          <div className="grid lg:grid-cols-[minmax(240px,300px)_1fr] lg:items-stretch">
            <div className="flex max-h-[min(50vh,360px)] flex-col border-b border-border lg:max-h-[520px] lg:border-r lg:border-b-0">
              <div className="shrink-0 border-b border-border px-4 py-3">
                <h3 className="text-sm font-semibold text-foreground">{t("title")}</h3>
                {mapMode === "create" ? (
                  <button
                    type="button"
                    className="btn btn-secondary mt-3 w-full"
                    onClick={exitMapMode}
                  >
                    {t("cancelCreateMode")}
                  </button>
                ) : mapMode === "relocate" ? (
                  <button
                    type="button"
                    className="btn btn-secondary mt-3 w-full"
                    onClick={exitMapMode}
                  >
                    {t("cancelEditMode")}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary mt-3 w-full"
                    onClick={startCreateMode}
                  >
                    {t("addLocation")}
                  </button>
                )}
              </div>

              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
                {isLoading ? (
                  <SectionBlockSkeleton rows={4} />
                ) : places.length === 0 ? (
                  <p className="px-2 py-6 text-center text-sm text-muted">{t("empty")}</p>
                ) : (
                  places.map((place, index) => {
                    const selected =
                      focusPlaceId === place.id ||
                      (formOpen && editing?.id === place.id) ||
                      (mapMode === "relocate" && editing?.id === place.id);
                    return (
                      <div
                        key={place.id}
                        className={`rounded-xl border p-3 transition ${
                          selected
                            ? "border-accent bg-accent-soft"
                            : "border-border bg-background hover:border-accent/40"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <button
                            type="button"
                            className="min-w-0 flex-1 text-left"
                            onClick={() => focusPlace(place)}
                          >
                            <p className="truncate text-sm font-semibold text-foreground">
                              <span className="mr-1.5 text-accent">{index + 1}.</span>
                              {place.name}
                            </p>
                            {place.address ? (
                              <p className="mt-0.5 truncate text-xs text-muted">{place.address}</p>
                            ) : null}
                            <p className="mt-1 font-mono text-[11px] text-muted">
                              {place.lat}, {place.lng}
                            </p>
                          </button>
                          <div className="flex shrink-0 items-center gap-0.5">
                            <button
                              type="button"
                              disabled={pickingOnMap}
                              aria-label={t("edit")}
                              title={t("edit")}
                              className="rounded-lg p-1.5 text-muted transition hover:bg-accent-soft hover:text-accent disabled:opacity-40"
                              onClick={() => openEdit(place)}
                            >
                              <PencilIcon />
                            </button>
                            <button
                              type="button"
                              disabled={del.isPending}
                              aria-busy={del.isPending && pendingDelete?.id === place.id}
                              aria-label={t("delete")}
                              className="rounded-lg p-1.5 text-danger transition hover:bg-danger-soft disabled:opacity-60"
                              onClick={() => {
                                setDeleteConflict(null);
                                setPendingDelete(place);
                              }}
                            >
                              <ButtonPending
                                pending={del.isPending && pendingDelete?.id === place.id}
                              >
                                <TrashIcon />
                              </ButtonPending>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="flex min-h-[240px] flex-col bg-background sm:min-h-[320px] lg:min-h-[520px]">
              {!pickingOnMap && (
                <div
                  className="flex shrink-0 gap-1 overflow-x-auto border-b border-border px-2 py-2"
                  role="tablist"
                  aria-label={t("mapDayTabsAria")}
                >
                  {Array.from({ length: dayCount }, (_, i) => i + 1).map((day) => {
                    const active = mapDayTab === day;
                    return (
                      <button
                        key={day}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        className={`shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                          active
                            ? "bg-accent text-accent-foreground"
                            : "bg-surface text-muted hover:bg-accent-soft hover:text-accent"
                        }`}
                        onClick={() => setMapDayTab(day)}
                      >
                        {t("mapTabDay", { day })}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    role="tab"
                    aria-selected={mapDayTab === "all"}
                    className={`shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                      mapDayTab === "all"
                        ? "bg-accent text-accent-foreground"
                        : "bg-surface text-muted hover:bg-accent-soft hover:text-accent"
                    }`}
                    onClick={() => setMapDayTab("all")}
                  >
                    {t("mapTabAllPlaces")}
                  </button>
                </div>
              )}
              <div
                className={`relative min-h-[200px] flex-1 ${
                  pickingOnMap ? "cursor-crosshair" : ""
                }`}
              >
                {isLoading ? (
                  <Skeleton className="absolute inset-0 rounded-none" />
                ) : (
                  <TripMap
                    places={places}
                    draft={pickingOnMap || formOpen ? coordDraft : null}
                    focusPlaceId={focusPlaceId}
                    routeItems={itineraryItems}
                    filterDay={filterDay}
                    showRoutes={showRoutes}
                    onMapClick={(coords) => {
                      if (mapMode === "create") {
                        setEditing(null);
                        setTextDraft(null);
                        openFormFromMap(coords);
                        return;
                      }
                      if (mapMode === "relocate" && editing) {
                        openFormFromMap(coords);
                      }
                    }}
                    className="absolute inset-0 h-full w-full rounded-none border-0"
                  />
                )}
                {pickingOnMap && (
                  <div className="pointer-events-none absolute inset-x-0 top-0 z-10 bg-accent/90 px-3 py-2 text-center text-xs font-medium text-accent-foreground">
                    {mapMode === "relocate" ? t("editModeMapBanner") : t("createModeMapBanner")}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <p className="border-t border-border px-4 py-2 text-xs text-muted">
          {mapMode === "create"
            ? t("createModeHint")
            : mapMode === "relocate"
              ? t("editModeHint", { name: editing?.name ?? "" })
              : mapDayTab === "all"
                ? t("mapHintAllPlaces")
                : t("mapHintDay", { day: mapDayTab })}
        </p>
      </MobileCollapsible>

      <PlaceFormDialog
        open={formOpen}
        mode={formMode}
        initial={editing ?? undefined}
        coordDraft={coordDraft}
        textDraft={textDraft}
        isPending={formPending}
        error={formError}
        formKey={editing ? `${editing.id}-${formKey}` : `create-${formKey}`}
        onClose={closeForm}
        onSubmit={handleSubmit}
        onRelocate={startRelocate}
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
              if (editing?.id === place.id) closeForm();
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

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M4 7h16M9 7V5h6v2M8 7l1 12h6l1-12" />
    </svg>
  );
}
