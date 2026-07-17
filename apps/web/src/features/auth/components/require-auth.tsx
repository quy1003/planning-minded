"use client";

import { useTranslations } from "next-intl";
import { useEffect, type ReactNode } from "react";
import { QueryError } from "@/components/ui/query-error";
import { Spinner } from "@/components/ui/spinner";
import { useRouter } from "@/i18n/navigation";
import { useMe } from "../hooks";

/** Chặn route app: chờ /auth/me; 401 → /login. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const t = useTranslations("Auth");
  const router = useRouter();
  const { data: user, isLoading, isError, error, refetch } = useMe();

  useEffect(() => {
    if (!isLoading && user === null) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-sm text-zinc-600">
        <Spinner className="size-5" />
        <p>{t("checkingSession")}</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6">
        <QueryError
          message={t("sessionError", {
            message: error instanceof Error ? error.message : "unknown",
          })}
          onRetry={() => {
            void refetch();
          }}
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-sm text-zinc-600">
        <Spinner className="size-5" />
        <p>{t("redirectingLogin")}</p>
      </div>
    );
  }

  return <>{children}</>;
}
