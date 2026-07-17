import { getTranslations } from "next-intl/server";
import { RegisterForm } from "@/features/auth/components/register-form";

export default async function RegisterPage() {
  const t = await getTranslations("Auth");

  return (
    <div className="panel p-6 shadow-sm">
      <h1 className="mb-6 font-display text-2xl font-semibold tracking-tight">{t("registerTitle")}</h1>
      <RegisterForm />
    </div>
  );
}
