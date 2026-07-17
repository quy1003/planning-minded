"use client";

import { useTranslations } from "next-intl";
import { useDeleteTrip } from "../hooks";

type Props = { tripId: string; title: string };

export function DeleteTripButton({ tripId, title }: Props) {
  const t = useTranslations("Trips");
  const del = useDeleteTrip();

  return (
    <button
      type="button"
      disabled={del.isPending}
      className="rounded-md border border-red-200 bg-white px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 disabled:opacity-60"
      onClick={() => {
        if (window.confirm(t("deleteConfirm", { title }))) {
          del.mutate(tripId);
        }
      }}
    >
      {del.isPending ? t("deleting") : t("delete")}
    </button>
  );
}
