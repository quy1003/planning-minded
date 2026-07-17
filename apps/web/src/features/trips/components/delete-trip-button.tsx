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
    <>
      <button
        type="button"
        disabled={del.isPending}
        aria-busy={del.isPending}
        className="btn btn-danger w-full sm:w-auto"
        onClick={() => {
          del.reset();
          setOpen(true);
        }}
      >
        <ButtonPending pending={del.isPending} onDark>
          <TrashIcon />
          {t("delete")}
        </ButtonPending>
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
    </>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M4 7h16M9 7V5h6v2M8 7l1 12h6l1-12" />
    </svg>
  );
}
