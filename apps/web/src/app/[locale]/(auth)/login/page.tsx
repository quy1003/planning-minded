import { getTranslations } from "next-intl/server";
import { LoginForm } from "@/features/auth/components/login-form";

export default async function LoginPage() {
  const t = await getTranslations("Auth");

  return (
    <div className="panel p-6 shadow-sm">
      <h1 className="mb-6 font-display text-2xl font-semibold tracking-tight">{t("loginTitle")}</h1>
      <LoginForm />
      <p className="mt-6 text-xs text-muted">
        {t("demoHint", { email: "demo@tripmind.local", password: "password123" })}
      </p>
    </div>
  );
}
