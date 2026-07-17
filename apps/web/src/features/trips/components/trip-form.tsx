"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { ApiError } from "@/lib/api-client";
import { tripFormSchema, type TripFormValues } from "../trip-form-schema";
import type { Trip } from "../types";

type Props = {
  mode: "create" | "edit";
  initial?: Trip;
  isPending: boolean;
  error: unknown;
  onSubmit: (values: TripFormValues) => void;
};

const statuses = ["DRAFT", "PLANNED", "COMPLETED"] as const;

export function TripForm({ mode, initial, isPending, error, onSubmit }: Props) {
  const t = useTranslations("Trips");
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TripFormValues>({
    resolver: zodResolver(tripFormSchema),
    defaultValues: {
      title: initial?.title ?? "",
      destinationName: initial?.destinationName ?? "",
      startDate: initial?.startDate ?? "",
      days: initial?.days ?? 3,
      partySize: initial?.partySize ?? 2,
      budget: initial?.budget ?? "1000000",
      currency: initial?.currency ?? "VND",
      status: initial?.status ?? "DRAFT",
    },
  });

  const serverError =
    error instanceof ApiError ? error.message : error ? t("saveFailed") : null;

  return (
    <form className="flex max-w-lg flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Field label={t("fields.title")} error={errors.title?.message}>
        <input
          className={inputClass}
          {...register("title")}
          autoComplete="off"
        />
      </Field>

      <Field label={t("fields.destination")} error={errors.destinationName?.message}>
        <input className={inputClass} {...register("destinationName")} autoComplete="off" />
      </Field>

      <Field label={t("fields.startDate")} error={errors.startDate?.message}>
        <input type="date" className={inputClass} {...register("startDate")} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label={t("fields.days")} error={errors.days?.message}>
          <input type="number" min={1} max={60} className={inputClass} {...register("days")} />
        </Field>
        <Field label={t("fields.partySize")} error={errors.partySize?.message}>
          <input type="number" min={1} max={50} className={inputClass} {...register("partySize")} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label={t("fields.budget")} error={errors.budget?.message}>
          <input
            inputMode="decimal"
            className={inputClass}
            placeholder="5000000"
            {...register("budget")}
          />
        </Field>
        <Field label={t("fields.currency")} error={errors.currency?.message}>
          <input className={inputClass} maxLength={3} {...register("currency")} />
        </Field>
      </div>

      <Field label={t("fields.status")} error={errors.status?.message}>
        <select className={inputClass} {...register("status")}>
          {statuses.map((status) => (
            <option key={status} value={status}>
              {t(`status.${status}`)}
            </option>
          ))}
        </select>
      </Field>

      {serverError && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {serverError}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-teal-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-900 disabled:opacity-60"
      >
        {isPending ? t("saving") : mode === "create" ? t("createSubmit") : t("saveSubmit")}
      </button>
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
