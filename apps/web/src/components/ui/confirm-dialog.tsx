"use client";

import { useTranslations } from "next-intl";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { ButtonPending } from "./button-pending";
import { DialogCloseButton } from "./dialog-close-button";
import { DIALOG_OVERLAY_CLASS, DialogPortal } from "./dialog-portal";

type Props = {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  danger = true,
  pending = false,
  onConfirm,
  onCancel,
}: Props) {
  const t = useTranslations("Common");
  const titleId = useId();
  const descId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCancelRef = useRef(onCancel);
  const pendingRef = useRef(pending);

  useEffect(() => {
    onCancelRef.current = onCancel;
    pendingRef.current = pending;
  }, [onCancel, pending]);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !pendingRef.current) {
        onCancelRef.current();
      }
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <DialogPortal>
      <div className={DIALOG_OVERLAY_CLASS}>
        <button
          type="button"
          aria-label="backdrop"
          className="absolute inset-0 bg-zinc-900/40 backdrop-blur-[1px] transition-opacity"
          disabled={pending}
          onClick={() => {
            if (!pending) onCancel();
          }}
        />
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={description ? descId : undefined}
          className="relative w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-xl"
        >
          <div className="flex items-start justify-between gap-3">
            <h2 id={titleId} className="text-base font-semibold text-foreground">
              {title}
            </h2>
            <DialogCloseButton ref={closeRef} disabled={pending} onClick={onCancel} />
          </div>
          {description ? (
            <div id={descId} className="mt-2 text-sm text-muted">
              {description}
            </div>
          ) : null}
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={pending}
              className="btn btn-secondary"
              onClick={onCancel}
            >
              {cancelLabel ?? t("cancel")}
            </button>
            <button
              type="button"
              disabled={pending}
              aria-busy={pending}
              className={`btn ${danger ? "btn-danger" : "btn-primary"}`}
              onClick={onConfirm}
            >
              <ButtonPending pending={pending} onDark>
                {confirmLabel ?? t("confirm")}
              </ButtonPending>
            </button>
          </div>
        </div>
      </div>
    </DialogPortal>
  );
}
