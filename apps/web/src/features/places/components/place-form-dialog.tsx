"use client";

import { useTranslations } from "next-intl";
import { useEffect, useId, useRef } from "react";
import { DialogCloseButton } from "@/components/ui/dialog-close-button";
import { DIALOG_OVERLAY_CLASS, DialogPortal } from "@/components/ui/dialog-portal";
import type { PlaceFormValues } from "../place-form-schema";
import type { Place } from "../types";
import { PlaceForm } from "./place-form";

type Props = {
  open: boolean;
  mode: "create" | "edit";
  initial?: Place;
  coordDraft?: { lat: number; lng: number } | null;
  isPending: boolean;
  error: unknown;
  formKey: string | number;
  onClose: () => void;
  onSubmit: (values: PlaceFormValues) => void;
  textDraft?: { name: string; address: string } | null;
  onRelocate?: (draft: { name: string; address: string }) => void;
};

export function PlaceFormDialog({
  open,
  mode,
  initial,
  coordDraft,
  textDraft,
  isPending,
  error,
  formKey,
  onClose,
  onSubmit,
  onRelocate,
}: Props) {
  const t = useTranslations("Places");
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

  const coordsLabel =
    coordDraft != null
      ? `${coordDraft.lat.toFixed(5)}, ${coordDraft.lng.toFixed(5)}`
      : initial
        ? `${initial.lat}, ${initial.lng}`
        : null;

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
          className="relative flex max-h-[min(90vh,640px)] w-full max-w-md flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xl"
        >
          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-5 py-4">
            <div className="min-w-0">
              <h2 id={titleId} className="font-display text-lg font-semibold text-foreground">
                {mode === "edit" ? t("editTitle") : t("addTitle")}
              </h2>
              {coordsLabel ? (
                <p className="mt-1 font-mono text-xs text-accent">
                  {t("pickedCoords", { coords: coordsLabel })}
                </p>
              ) : null}
            </div>
            <DialogCloseButton ref={closeRef} disabled={isPending} onClick={onClose} />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <PlaceForm
              key={formKey}
              mode={mode}
              initial={initial}
              coordDraft={coordDraft}
              textDraft={textDraft}
              isPending={isPending}
              error={error}
              onSubmit={onSubmit}
              onCancel={onClose}
              onRelocate={mode === "edit" ? onRelocate : undefined}
            />
          </div>
        </div>
      </div>
    </DialogPortal>
  );
}
