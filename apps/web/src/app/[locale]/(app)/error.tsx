"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { InlineAlert } from "@/components/ui/inline-alert";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AppError({ error, reset }: Props) {
  const t = useTranslations("Common");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg space-y-3 py-10">
      <h1 className="text-lg font-semibold text-zinc-900">{t("somethingWrong")}</h1>
      <InlineAlert
        variant="error"
        action={
          <button
            type="button"
            className="rounded-md border border-red-300 bg-white px-2.5 py-1 text-xs font-medium text-red-800 hover:bg-red-100"
            onClick={reset}
          >
            {t("retry")}
          </button>
        }
      >
        {error.message || t("tryAgainHint")}
      </InlineAlert>
      <p className="text-sm text-zinc-500">{t("tryAgainHint")}</p>
    </div>
  );
}
