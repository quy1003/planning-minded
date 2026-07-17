"use client";

import { useTranslations } from "next-intl";
import { forwardRef } from "react";

type Props = {
  disabled?: boolean;
  onClick: () => void;
};

/** Nút X góc trên modal — đóng, không thay Hủy ở footer. */
export const DialogCloseButton = forwardRef<HTMLButtonElement, Props>(
  function DialogCloseButton({ disabled, onClick }, ref) {
    const t = useTranslations("Common");
    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled}
        aria-label={t("close")}
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-muted transition hover:bg-accent-soft hover:text-foreground disabled:opacity-60"
        onClick={onClick}
      >
        <CloseIcon />
      </button>
    );
  },
);

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
