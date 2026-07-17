import { getTranslations } from "next-intl/server";
import { LoginForm } from "@/features/auth/components/login-form";

export default async function LoginPage() {
  const t = await getTranslations("Auth");

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">{t("loginTitle")}</h1>
      <LoginForm />
      <p className="mt-6 text-xs text-zinc-500">
        {t("demoHint", { email: "demo@tripmind.local", password: "password123" })}
      </p>
    </div>
  );
}
