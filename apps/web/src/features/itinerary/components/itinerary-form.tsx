"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import type { Place } from "@/features/places/types";
import { ButtonPending } from "@/components/ui/button-pending";
import { ApiError } from "@/lib/api-client";
import {
  itineraryFormSchema,
  toTimeInputValue,
  type ItineraryFormValues,
} from "../itinerary-form-schema";
import { DAY_SLOTS, type ItineraryItem } from "../types";

type Props = {
  mode: "create" | "edit";
  places: Place[];
  tripDays: number;
  initial?: ItineraryItem;
  defaultDay?: number;
  defaultSlot?: (typeof DAY_SLOTS)[number];
  isPending: boolean;
  error: unknown;
  onSubmit: (values: ItineraryFormValues) => void;
  onCancel?: () => void;
};

export function ItineraryForm({
  mode,
  places,
  tripDays,
  initial,
  defaultDay = 1,
  defaultSlot = "MORNING",
  isPending,
  error,
  onSubmit,
  onCancel,
}: Props) {
  const t = useTranslations("Itinerary");
  const tCommon = useTranslations("Common");
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ItineraryFormValues>({
    resolver: zodResolver(itineraryFormSchema),
    defaultValues: {
      placeId: initial?.placeId ?? places[0]?.id ?? "",
      dayNumber: initial?.dayNumber ?? defaultDay,
      slot: initial?.slot ?? defaultSlot,
      title: initial?.title ?? "",
      description: initial?.description ?? "",
      startTime: toTimeInputValue(initial?.startTime ?? null),
      endTime: toTimeInputValue(initial?.endTime ?? null),
      durationMin: initial?.durationMin != null ? String(initial.durationMin) : "",
      estCost: initial && initial.estCost !== "0" ? initial.estCost : "",
    },
  });

  const serverError =
    error instanceof ApiError
      ? error.status === 409
        ? t("conflictOrder")
        : error.message
      : error
        ? t("saveFailed")
        : null;

  if (places.length === 0) {
    return <p className="text-sm text-zinc-600">{t("needPlaces")}</p>;
  }

  return (
    <form className="flex flex-col gap-3" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Field label={t("fields.place")} error={errors.placeId?.message}>
        <select className={inputClass} {...register("placeId")}>
          {places.map((place) => (
            <option key={place.id} value={place.id}>
              {place.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label={t("fields.title")} error={errors.title?.message}>
        <input className={inputClass} {...register("title")} autoComplete="off" />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label={t("fields.day")} error={errors.dayNumber?.message}>
          <select className={inputClass} {...register("dayNumber")}>
            {Array.from({ length: tripDays }, (_, i) => i + 1).map((day) => (
              <option key={day} value={day}>
                {t("dayLabel", { day })}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("fields.slot")} error={errors.slot?.message}>
          <select className={inputClass} {...register("slot")}>
            {DAY_SLOTS.map((slot) => (
              <option key={slot} value={slot}>
                {t(`slots.${slot}`)}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label={t("fields.startTime")} error={errors.startTime?.message}>
          <input type="time" className={inputClass} {...register("startTime")} />
        </Field>
        <Field label={t("fields.endTime")} error={errors.endTime?.message}>
          <input type="time" className={inputClass} {...register("endTime")} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label={t("fields.durationMin")} error={errors.durationMin?.message}>
          <input type="number" min={1} className={inputClass} {...register("durationMin")} />
        </Field>
        <Field label={t("fields.estCost")} error={errors.estCost?.message}>
          <input inputMode="decimal" className={inputClass} {...register("estCost")} />
        </Field>
      </div>

      <Field label={t("fields.description")} error={errors.description?.message}>
        <textarea className={inputClass} rows={2} {...register("description")} />
      </Field>

      {serverError && (
        <p className="rounded-md border border-danger-border bg-danger-soft px-3 py-2 text-sm text-danger">
          {serverError}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-end gap-2">
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn btn-secondary" disabled={isPending}>
            {tCommon("cancel")}
          </button>
        )}
        <button type="submit" disabled={isPending} aria-busy={isPending} className="btn btn-primary">
          <ButtonPending pending={isPending} onDark>
            {mode === "create" ? t("addSubmit") : t("saveSubmit")}
          </ButtonPending>
        </button>
      </div>
    </form>
  );
}

const inputClass = "input-field";

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {children}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
