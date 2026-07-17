"use client";

import { useTranslations } from "next-intl";
import { useEffect, type ReactNode } from "react";
import { useRouter } from "@/i18n/navigation";
import { useMe } from "../hooks";

/** Chặn route app: chờ /auth/me; 401 → /login. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const t = useTranslations("Auth");
  const router = useRouter();
  const { data: user, isLoading, isError, error } = useMe();

  useEffect(() => {
    if (!isLoading && user === null) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-zinc-600">
        {t("checkingSession")}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 text-sm text-red-700">
        {t("sessionError", {
          message: error instanceof Error ? error.message : "unknown",
        })}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-zinc-600">
        {t("redirectingLogin")}
      </div>
    );
  }

  return <>{children}</>;
}
