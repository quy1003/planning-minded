import { useTranslations } from "next-intl";
import type { Trip } from "../types";

type Props = {
  status: Trip["status"];
  /** "solid" = màu riêng theo trạng thái (hero). "frosted" = nền mờ trắng/đen, đọc được trên dải màu trang trí (card list). */
  variant?: "solid" | "frosted";
  className?: string;
};

/** Chip trạng thái trip — dùng chung cho hero (trang chi tiết) và list. */
export function TripStatusBadge({ status, variant = "solid", className = "" }: Props) {
  const t = useTranslations("Trips");
  const variantClass = variant === "frosted" ? frostedChipClass(status) : statusChipClass(status);

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold tracking-wide ${variantClass} ${className}`}
    >
      {t(`status.${status}`)}
    </span>
  );
}

/** Nền trắng/đen mờ đồng nhất (đọc được trên mọi màu cover) — chỉ đổi màu CHỮ theo trạng thái để phân biệt. */
function frostedChipClass(status: Trip["status"]): string {
  const base = "backdrop-blur-sm bg-white/85 dark:bg-black/60";
  switch (status) {
    case "PLANNED":
      return `${base} text-accent`;
    case "COMPLETED":
      return `${base} text-success`;
    case "DRAFT":
    default:
      return `${base} text-zinc-800 dark:text-foreground`;
  }
}

function statusChipClass(status: Trip["status"]): string {
  switch (status) {
    case "PLANNED":
      return "border border-accent/30 bg-accent-soft text-accent";
    case "COMPLETED":
      return "border border-success/30 bg-success-soft text-success-foreground";
    case "DRAFT":
    default:
      return "border border-border bg-surface/80 text-muted backdrop-blur";
  }
}
