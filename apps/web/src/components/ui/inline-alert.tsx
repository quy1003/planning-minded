import type { ReactNode } from "react";

type Variant = "error" | "success" | "info";

const styles: Record<Variant, string> = {
  error: "border-red-200 bg-red-50 text-red-800",
  success: "border-teal-200 bg-teal-50 text-teal-900",
  info: "border-zinc-200 bg-zinc-50 text-zinc-700",
};

type Props = {
  variant?: Variant;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function InlineAlert({ variant = "error", children, action, className }: Props) {
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={`flex flex-wrap items-start justify-between gap-3 rounded-lg border px-3 py-2.5 text-sm ${styles[variant]} ${className ?? ""}`}
    >
      <div className="min-w-0 flex-1">{children}</div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
