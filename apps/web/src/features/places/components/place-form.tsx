"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useEffect, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { ButtonPending } from "@/components/ui/button-pending";
import { ApiError } from "@/lib/api-client";
import { placeFormSchema, type PlaceFormValues } from "../place-form-schema";
import type { Place } from "../types";

type TextDraft = { name: string; address: string };

type Props = {
  mode: "create" | "edit";
  initial?: Place;
  /** Tọa độ từ map — ưu tiên khi mở form. */
  coordDraft?: { lat: number; lng: number } | null;
  /** Giữ name/address khi vừa chọn lại vị trí trên map. */
  textDraft?: TextDraft | null;
  isPending: boolean;
  error: unknown;
  onSubmit: (values: PlaceFormValues) => void;
  onCancel?: () => void;
  /** Chỉ edit: tạm đóng form → click map đổi vị trí. */
  onRelocate?: (draft: TextDraft) => void;
};

function resolveCoords(
  initial: Place | undefined,
  coordDraft: { lat: number; lng: number } | null | undefined,
): { lat: number; lng: number } {
  if (coordDraft) {
    return {
      lat: Number(coordDraft.lat.toFixed(6)),
      lng: Number(coordDraft.lng.toFixed(6)),
    };
  }
  if (initial) {
    return {
      lat: Number.parseFloat(initial.lat),
      lng: Number.parseFloat(initial.lng),
    };
  }
  return { lat: 11.94, lng: 108.45 };
}

export function PlaceForm({
  mode,
  initial,
  coordDraft,
  textDraft,
  isPending,
  error,
  onSubmit,
  onCancel,
  onRelocate,
}: Props) {
  const t = useTranslations("Places");
  const tCommon = useTranslations("Common");
  const coords = resolveCoords(initial, coordDraft);
  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<PlaceFormValues>({
    resolver: zodResolver(placeFormSchema),
    defaultValues: {
      name: textDraft?.name ?? initial?.name ?? "",
      address: textDraft?.address ?? initial?.address ?? "",
      lat: coords.lat,
      lng: coords.lng,
    },
  });

  useEffect(() => {
    if (!coordDraft) return;
    setValue("lat", Number(coordDraft.lat.toFixed(6)), { shouldValidate: true });
    setValue("lng", Number(coordDraft.lng.toFixed(6)), { shouldValidate: true });
  }, [coordDraft, setValue]);

  const serverError =
    error instanceof ApiError ? error.message : error ? t("saveFailed") : null;

  return (
    <form className="flex flex-col gap-3" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Field label={t("fields.name")} error={errors.name?.message}>
        <input className={inputClass} {...register("name")} autoComplete="off" />
      </Field>
      <Field label={t("fields.address")} error={errors.address?.message}>
        <input className={inputClass} {...register("address")} autoComplete="off" />
      </Field>

      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("fields.lat")} error={errors.lat?.message}>
            <input
              type="text"
              inputMode="decimal"
              readOnly
              className={`${inputClass} font-mono`}
              {...register("lat", { valueAsNumber: true })}
            />
          </Field>
          <Field label={t("fields.lng")} error={errors.lng?.message}>
            <input
              type="text"
              inputMode="decimal"
              readOnly
              className={`${inputClass} font-mono`}
              {...register("lng", { valueAsNumber: true })}
            />
          </Field>
        </div>
        {onRelocate && (
          <button
            type="button"
            disabled={isPending}
            className="btn btn-accent-soft btn-sm w-full"
            onClick={() => {
              const values = getValues();
              onRelocate({
                name: values.name ?? "",
                address: values.address ?? "",
              });
            }}
          >
            <MapPinIcon />
            {t("relocateOnMap")}
          </button>
        )}
      </div>

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

function MapPinIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 21s7-4.5 7-10a7 7 0 1 0-14 0c0 5.5 7 10 7 10Z" />
      <circle cx="12" cy="11" r="2.5" />
    </svg>
  );
}
