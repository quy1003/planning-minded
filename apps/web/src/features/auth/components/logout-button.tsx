"use client";

import { useTranslations } from "next-intl";
import { ButtonPending } from "@/components/ui/button-pending";
import { useLogout } from "../hooks";

export function LogoutButton() {
  const t = useTranslations("Auth");
  const logout = useLogout();

  return (
    <button
      type="button"
      onClick={() => logout.mutate()}
      disabled={logout.isPending}
      aria-busy={logout.isPending}
      className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-800 hover:bg-zinc-100 disabled:opacity-60"
    >
      <ButtonPending pending={logout.isPending}>{t("logout")}</ButtonPending>
    </button>
  );
}
