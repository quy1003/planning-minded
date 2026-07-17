"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { CreateTripDialog } from "./create-trip-dialog";

type Props = {
  className?: string;
  children: ReactNode;
};

/** Nút mở modal tạo trip — thay cho điều hướng sang trang `/trips/new`. */
export function CreateTripButton({ className, children }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        <PlusIcon />
        {children}
      </button>
      <CreateTripDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
