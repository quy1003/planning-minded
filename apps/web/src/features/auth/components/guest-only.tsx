"use client";

import { useTranslations } from "next-intl";
import { useEffect, type ReactNode } from "react";
import { useRouter } from "@/i18n/navigation";
import { useMe } from "../hooks";

/** Trang login/register: đã có session → /trips. */
export function GuestOnly({ children }: { children: ReactNode }) {
  const t = useTranslations("Auth");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const { data: user, isLoading } = useMe();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/trips");
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-zinc-600">
        {tCommon("loading")}
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-zinc-600">
        {t("redirectingApp")}
      </div>
    );
  }

  return <>{children}</>;
}
