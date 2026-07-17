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
            className="btn btn-secondary btn-sm border-danger-border text-danger hover:bg-danger-soft"
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
