"use client";

import { useTranslations } from "next-intl";
import { useEffect, useId, useRef } from "react";
import type { Place } from "@/features/places/types";
import { DialogCloseButton } from "@/components/ui/dialog-close-button";
import { DIALOG_OVERLAY_CLASS, DialogPortal } from "@/components/ui/dialog-portal";
import type { ItineraryFormValues } from "../itinerary-form-schema";
import type { ItineraryItem } from "../types";
import { ItineraryForm } from "./itinerary-form";

type Props = {
  open: boolean;
  mode: "create" | "edit";
  places: Place[];
  tripDays: number;
  initial?: ItineraryItem;
  isPending: boolean;
  error: unknown;
  formKey: string | number;
  onClose: () => void;
  onSubmit: (values: ItineraryFormValues) => void;
};

export function ItineraryFormDialog({
  open,
  mode,
  places,
  tripDays,
  initial,
  isPending,
  error,
  formKey,
  onClose,
  onSubmit,
}: Props) {
  const t = useTranslations("Itinerary");
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !isPending) onCloseRef.current();
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, isPending]);

  if (!open) return null;

  return (
    <DialogPortal>
      <div className={DIALOG_OVERLAY_CLASS}>
        <button
          type="button"
          aria-label="backdrop"
          className="absolute inset-0 bg-zinc-900/40 backdrop-blur-[1px]"
          disabled={isPending}
          onClick={() => {
            if (!isPending) onClose();
          }}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="relative flex max-h-[min(90vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xl"
        >
          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-5 py-4">
            <h2 id={titleId} className="font-display text-lg font-semibold text-foreground">
              {mode === "edit" ? t("editTitle") : t("addTitle")}
            </h2>
            <DialogCloseButton ref={closeRef} disabled={isPending} onClick={onClose} />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            {places.length === 0 ? (
              <p className="text-sm text-muted">{t("needPlaces")}</p>
            ) : (
              <ItineraryForm
                key={formKey}
                mode={mode}
                places={places}
                tripDays={tripDays}
                initial={initial}
                isPending={isPending}
                error={error}
                onSubmit={onSubmit}
                onCancel={onClose}
              />
            )}
          </div>
        </div>
      </div>
    </DialogPortal>
  );
}
