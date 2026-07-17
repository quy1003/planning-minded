"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useEffect, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { ButtonPending } from "@/components/ui/button-pending";
import { ApiError } from "@/lib/api-client";
import { placeFormSchema, type PlaceFormValues } from "../place-form-schema";
import type { Place } from "../types";

type Props = {
  mode: "create" | "edit";
  initial?: Place;
  /** Đồng bộ từ click map / chọn list. */
  coordDraft?: { lat: number; lng: number } | null;
  isPending: boolean;
  error: unknown;
  onSubmit: (values: PlaceFormValues) => void;
  onCancelEdit?: () => void;
};

export function PlaceForm({
  mode,
  initial,
  coordDraft,
  isPending,
  error,
  onSubmit,
  onCancelEdit,
}: Props) {
  const t = useTranslations("Places");
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<PlaceFormValues>({
    resolver: zodResolver(placeFormSchema),
    defaultValues: {
      name: initial?.name ?? "",
      address: initial?.address ?? "",
      lat: initial ? Number.parseFloat(initial.lat) : 11.94,
      lng: initial ? Number.parseFloat(initial.lng) : 108.45,
    },
  });

  useEffect(() => {
    if (!coordDraft) return;
    setValue("lat", Number(coordDraft.lat.toFixed(6)), { shouldValidate: true });
    setValue("lng", Number(coordDraft.lng.toFixed(6)), { shouldValidate: true });
  }, [coordDraft, setValue]);

  useEffect(() => {
    if (!initial) return;
    setValue("name", initial.name);
    setValue("address", initial.address ?? "");
    setValue("lat", Number.parseFloat(initial.lat));
    setValue("lng", Number.parseFloat(initial.lng));
  }, [initial, setValue]);

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
      <div className="grid grid-cols-2 gap-3">
        <Field label={t("fields.lat")} error={errors.lat?.message}>
          <input type="number" step="any" className={inputClass} {...register("lat")} />
        </Field>
        <Field label={t("fields.lng")} error={errors.lng?.message}>
          <input type="number" step="any" className={inputClass} {...register("lng")} />
        </Field>
      </div>
      <p className="text-xs text-zinc-500">{t("mapHint")}</p>

      {serverError && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {serverError}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={isPending}
          aria-busy={isPending}
          className="rounded-md bg-teal-800 px-4 py-2 text-sm font-medium text-white hover:bg-teal-900 disabled:opacity-60"
        >
          <ButtonPending pending={isPending} onDark>
            {mode === "create" ? t("addSubmit") : t("saveSubmit")}
          </ButtonPending>
        </button>
        {mode === "edit" && onCancelEdit && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
          >
            {t("cancelEdit")}
          </button>
        )}
      </div>
    </form>
  );
}

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20";

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
      <label className="text-sm font-medium text-zinc-800">{label}</label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
