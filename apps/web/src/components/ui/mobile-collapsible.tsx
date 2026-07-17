"use client";

import { useState, type ReactNode } from "react";

type Props = {
  title: string;
  description?: string;
  /** Mobile mặc định mở/đóng. Desktop luôn hiện body. */
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
};

/**
 * Mobile: accordion (panel + ▾). Desktop: không accordion — hiện title + children luôn.
 * Một instance children (quan trọng với map — tránh init MapLibre 2 lần).
 */
export function MobileCollapsible({
  title,
  description,
  defaultOpen = false,
  children,
  className = "",
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className={`overflow-hidden rounded-xl border border-border bg-card shadow-sm lg:rounded-none lg:border-0 lg:bg-transparent lg:shadow-none ${className}`}
    >
      {/* Mobile header — bấm để đóng/mở */}
      <button
        type="button"
        className="flex w-full items-start justify-between gap-3 px-5 py-4 text-left lg:hidden"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-foreground">{title}</span>
          {description ? (
            <span className="mt-0.5 block text-xs font-normal text-muted">{description}</span>
          ) : null}
        </span>
        <span className="mt-0.5 shrink-0 text-muted" aria-hidden>
          {open ? "▴" : "▾"}
        </span>
      </button>

      {/* Desktop title (không toggle) */}
      <div className="mb-3 hidden lg:block">
        <h2 className="font-display text-xl font-semibold text-foreground">{title}</h2>
        {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
      </div>

      <div
        className={`border-t border-border lg:border-0 ${open ? "block" : "hidden"} lg:block`}
      >
        {children}
      </div>
    </div>
  );
}
