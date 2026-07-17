import { redirect } from "@/i18n/navigation";

type Props = {
  params: Promise<{ locale: string }>;
};

/** `/vi` hoặc `/en` → trips (middleware/session sẽ đẩy về login nếu cần). */
export default async function LocaleHomePage({ params }: Props) {
  const { locale } = await params;
  redirect({ href: "/trips", locale });
}
