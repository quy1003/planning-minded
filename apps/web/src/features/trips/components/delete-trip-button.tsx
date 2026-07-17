"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { ButtonPending } from "@/components/ui/button-pending";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { InlineAlert } from "@/components/ui/inline-alert";
import { useDeleteTrip } from "../hooks";

type Props = { tripId: string; title: string };

export function DeleteTripButton({ tripId, title }: Props) {
  const t = useTranslations("Trips");
  const del = useDeleteTrip();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:items-end">
      <button
        type="button"
        disabled={del.isPending}
        aria-busy={del.isPending}
        className="rounded-md border border-red-200 bg-white px-3 py-1.5 text-sm text-red-700 transition hover:bg-red-50 disabled:opacity-60"
        onClick={() => {
          del.reset();
          setOpen(true);
        }}
      >
        <ButtonPending pending={del.isPending}>{t("delete")}</ButtonPending>
      </button>

      {del.isError && (
        <InlineAlert variant="error">
          {del.error instanceof Error ? del.error.message : t("deleteFailed")}
        </InlineAlert>
      )}

      <ConfirmDialog
        open={open}
        title={t("deleteConfirmTitle")}
        description={t("deleteConfirm", { title })}
        confirmLabel={t("delete")}
        pending={del.isPending}
        onCancel={() => {
          if (!del.isPending) setOpen(false);
        }}
        onConfirm={() => {
          del.mutate(tripId, {
            onSuccess: () => setOpen(false),
          });
        }}
      />
    </div>
  );
}
