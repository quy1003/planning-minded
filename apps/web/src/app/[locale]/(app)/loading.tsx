import { getTranslations } from "next-intl/server";
import { Spinner } from "@/components/ui/spinner";

export default async function AppLoading() {
  const t = await getTranslations("Common");

  return (
    <div className="flex flex-1 items-center justify-center gap-2 py-16 text-sm text-zinc-600">
      <Spinner />
      <span>{t("loading")}</span>
    </div>
  );
}
