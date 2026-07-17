"use client";

import { useTranslations } from "next-intl";
import { useEffect, useId, useRef } from "react";
import { DialogCloseButton } from "./dialog-close-button";
import { DIALOG_OVERLAY_CLASS, DialogPortal } from "./dialog-portal";

type Props = {
  open: boolean;
  title: string;
  description?: string;
  actionLabel?: string;
  onClose: () => void;
};

export function SuccessDialog({
  open,
  title,
  description,
  actionLabel,
  onClose,
}: Props) {
  const t = useTranslations("Common");
  const titleId = useId();
  const descId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onCloseRef.current();
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
          className="absolute inset-0 bg-zinc-900/40 backdrop-blur-[1px]"
          onClick={onClose}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={description ? descId : undefined}
          className="relative w-full max-w-sm rounded-xl border border-border bg-card p-6 text-center shadow-xl"
        >
          <div className="absolute top-3 right-3">
            <DialogCloseButton ref={closeRef} onClick={onClose} />
          </div>
          <div
            aria-hidden
            className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-success-soft text-2xl text-success"
          >
            ✓
          </div>
          <h2 id={titleId} className="text-base font-semibold text-foreground">
            {title}
          </h2>
          {description ? (
            <p id={descId} className="mt-2 text-sm text-muted">
              {description}
            </p>
          ) : null}
          <button type="button" className="btn btn-primary mt-5 w-full" onClick={onClose}>
            {actionLabel ?? t("ok")}
          </button>
        </div>
      </div>
    </DialogPortal>
  );
}
