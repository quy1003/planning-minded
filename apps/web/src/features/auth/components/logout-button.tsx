"use client";

import { useTranslations } from "next-intl";
import { useLogout } from "../hooks";

export function LogoutButton() {
  const t = useTranslations("Auth");
  const logout = useLogout();

  return (
    <button
      type="button"
      onClick={() => logout.mutate()}
      disabled={logout.isPending}
      className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-800 hover:bg-zinc-100 disabled:opacity-60"
    >
      {logout.isPending ? t("loggingOut") : t("logout")}
    </button>
  );
}
