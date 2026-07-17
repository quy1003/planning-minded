"use client";

import { useTranslations } from "next-intl";
import { useEffect, useId, useRef } from "react";

type Props = {
  open: boolean;
  title: string;
  description?: string;
  actionLabel?: string;
  onClose: () => void;
};

/** Modal báo thành công — 1 nút đóng. Dùng sau save (thay banner dưới form). */
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
  const okRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    okRef.current?.focus();

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
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        aria-label={actionLabel ?? t("ok")}
        className="absolute inset-0 bg-zinc-900/40 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        className="relative w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6 text-center shadow-xl"
      >
        <div
          aria-hidden
          className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-teal-50 text-2xl text-teal-800"
        >
          ✓
        </div>
        <h2 id={titleId} className="text-base font-semibold text-zinc-900">
          {title}
        </h2>
        {description ? (
          <p id={descId} className="mt-2 text-sm text-zinc-600">
            {description}
          </p>
        ) : null}
        <button
          ref={okRef}
          type="button"
          className="mt-5 w-full rounded-md bg-teal-800 px-3 py-2.5 text-sm font-medium text-white hover:bg-teal-900"
          onClick={onClose}
        >
          {actionLabel ?? t("ok")}
        </button>
      </div>
    </div>
  );
}
