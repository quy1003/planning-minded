"use client";

import { useTranslations } from "next-intl";
import { InlineAlert } from "./inline-alert";

type Props = {
  message: string;
  onRetry?: () => void;
};

export function QueryError({ message, onRetry }: Props) {
  const t = useTranslations("Common");

  return (
    <InlineAlert
      variant="error"
      action={
        onRetry ? (
          <button
            type="button"
            className="rounded-md border border-red-300 bg-white px-2.5 py-1 text-xs font-medium text-red-800 hover:bg-red-100"
            onClick={onRetry}
          >
            {t("retry")}
          </button>
        ) : null
      }
    >
      {message}
    </InlineAlert>
  );
}
