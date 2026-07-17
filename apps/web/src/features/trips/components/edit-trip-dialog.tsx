"use client";

import { useTranslations } from "next-intl";
import { useEffect, useId, useRef } from "react";
import { DialogCloseButton } from "@/components/ui/dialog-close-button";
import { DIALOG_OVERLAY_CLASS, DialogPortal } from "@/components/ui/dialog-portal";
import { useUpdateTrip } from "../hooks";
import { toUpdateTripInput, type TripFormValues } from "../trip-form-schema";
import type { Trip } from "../types";
import { TripForm } from "./trip-form";

type Props = {
  trip: Trip;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
};

export function EditTripDialog({ trip, open, onClose, onSaved }: Props) {
  const t = useTranslations("Trips");
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  const update = useUpdateTrip(trip.id);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !update.isPending) onCloseRef.current();
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, update.isPending]);

  if (!open) return null;

  function handleSubmit(values: TripFormValues) {
    update.mutate(toUpdateTripInput(values), {
      onSuccess: () => {
        onClose();
        onSaved();
      },
    });
  }

  return (
    <DialogPortal>
      <div className={DIALOG_OVERLAY_CLASS}>
        <button
          type="button"
          aria-label="backdrop"
          className="absolute inset-0 bg-zinc-900/40 backdrop-blur-[1px]"
          disabled={update.isPending}
          onClick={() => {
            if (!update.isPending) onClose();
          }}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="relative flex max-h-[min(90vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xl"
        >
          <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
            <div>
              <h2 id={titleId} className="font-display text-lg font-semibold text-foreground">
                {t("editSection")}
              </h2>
              <p className="mt-0.5 text-sm text-muted">{trip.title}</p>
            </div>
            <DialogCloseButton
              ref={closeRef}
              disabled={update.isPending}
              onClick={onClose}
            />
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4">
            <TripForm
              mode="edit"
              initial={trip}
              isPending={update.isPending}
              error={update.error}
              onSubmit={handleSubmit}
              onCancel={onClose}
            />
          </div>
        </div>
      </div>
    </DialogPortal>
  );
}
