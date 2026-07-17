"use client";

import { useTranslations } from "next-intl";
import { useEffect, useId, useRef } from "react";
import { DialogCloseButton } from "@/components/ui/dialog-close-button";
import { DIALOG_OVERLAY_CLASS, DialogPortal } from "@/components/ui/dialog-portal";
import { useCreateTrip } from "../hooks";
import { toCreateTripInput, type TripFormValues } from "../trip-form-schema";
import { TripForm } from "./trip-form";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function CreateTripDialog({ open, onClose }: Props) {
  const t = useTranslations("Trips");
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  const create = useCreateTrip();

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !create.isPending) onCloseRef.current();
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, create.isPending]);

  if (!open) return null;

  function handleSubmit(values: TripFormValues) {
    create.mutate(toCreateTripInput(values), {
      onSuccess: () => onClose(),
    });
  }

  return (
    <DialogPortal>
      <div className={DIALOG_OVERLAY_CLASS}>
        <button
          type="button"
          aria-label="backdrop"
          className="absolute inset-0 bg-zinc-900/40 backdrop-blur-[1px]"
          disabled={create.isPending}
          onClick={() => {
            if (!create.isPending) onClose();
          }}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="relative flex max-h-[min(90vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xl"
        >
          <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
            <h2 id={titleId} className="font-display text-lg font-semibold text-foreground">
              {t("newTitle")}
            </h2>
            <DialogCloseButton ref={closeRef} disabled={create.isPending} onClick={onClose} />
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4">
            <TripForm
              mode="create"
              isPending={create.isPending}
              error={create.error}
              onSubmit={handleSubmit}
              onCancel={onClose}
            />
          </div>
        </div>
      </div>
    </DialogPortal>
  );
}
