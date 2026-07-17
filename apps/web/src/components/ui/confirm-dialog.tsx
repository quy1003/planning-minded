"use client";

import { useTranslations } from "next-intl";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { ButtonPending } from "./button-pending";

type Props = {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Nút confirm màu đỏ (xóa). */
  danger?: boolean;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Dialog confirm accessible nhẹ — Escape / click backdrop = hủy.
 * Không thêm Radix/Headless để giữ Phase 1 gọn; refactor design sau có thể thay.
 */
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
  const cancelRef = useRef<HTMLButtonElement>(null);
  const onCancelRef = useRef(onCancel);
  const pendingRef = useRef(pending);

  useEffect(() => {
    onCancelRef.current = onCancel;
    pendingRef.current = pending;
  }, [onCancel, pending]);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();

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
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        aria-label={cancelLabel ?? t("cancel")}
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
        className="relative w-full max-w-md rounded-xl border border-zinc-200 bg-white p-5 shadow-xl"
      >
        <h2 id={titleId} className="text-base font-semibold text-zinc-900">
          {title}
        </h2>
        {description ? (
          <div id={descId} className="mt-2 text-sm text-zinc-600">
            {description}
          </div>
        ) : null}
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            ref={cancelRef}
            type="button"
            disabled={pending}
            className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
            onClick={onCancel}
          >
            {cancelLabel ?? t("cancel")}
          </button>
          <button
            type="button"
            disabled={pending}
            aria-busy={pending}
            className={`inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-white disabled:opacity-60 ${
              danger
                ? "bg-red-700 hover:bg-red-800"
                : "bg-teal-800 hover:bg-teal-900"
            }`}
            onClick={onConfirm}
          >
            <ButtonPending pending={pending} onDark>
              {confirmLabel ?? t("confirm")}
            </ButtonPending>
          </button>
        </div>
      </div>
    </div>
  );
}
