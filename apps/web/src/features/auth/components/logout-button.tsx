"use client";

import { useTranslations } from "next-intl";
import { ButtonPending } from "@/components/ui/button-pending";
import { useLogout } from "../hooks";

/**
 * Desktop: icon + chữ đỏ. Mobile: chỉ icon (aria-label vẫn có chữ).
 */
export function LogoutButton() {
  const t = useTranslations("Auth");
  const logout = useLogout();

  return (
    <button
      type="button"
      onClick={() => logout.mutate()}
      disabled={logout.isPending}
      aria-busy={logout.isPending}
      aria-label={t("logout")}
      title={t("logout")}
      className="inline-flex size-9 shrink-0 items-center justify-center gap-1.5 rounded-lg text-danger transition hover:bg-danger-soft disabled:opacity-60 sm:h-9 sm:w-auto sm:px-3"
    >
      <ButtonPending pending={logout.isPending}>
        <LogoutIcon />
        <span className="hidden text-sm font-semibold sm:inline">{t("logout")}</span>
      </ButtonPending>
    </button>
  );
}

/** Cửa bên phải + mũi tên ra trái (logout). */
function LogoutIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <polyline points="10 17 5 12 10 7" />
      <line x1="5" y1="12" x2="15" y2="12" />
    </svg>
  );
}
