"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@tripmind/shared";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { ButtonPending } from "@/components/ui/button-pending";
import { Link } from "@/i18n/navigation";
import { ApiError } from "@/lib/api-client";
import { useLogin } from "../hooks";

export function LoginForm() {
  const t = useTranslations("Auth");
  const tCommon = useTranslations("Common");
  const login = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const serverError =
    login.error instanceof ApiError
      ? login.error.message
      : login.error
        ? t("loginFailed")
        : null;

  return (
    <form
      className="space-y-4"
      onSubmit={handleSubmit((values) => login.mutate(values))}
      noValidate
    >
      <div className="space-y-1">
        <label className="text-sm font-medium text-foreground" htmlFor="email">
          {tCommon("email")}
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          className="input-field"
          {...register("email")}
        />
        {errors.email && <p className="text-xs text-danger">{errors.email.message}</p>}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-foreground" htmlFor="password">
          {tCommon("password")}
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          className="input-field"
          {...register("password")}
        />
        {errors.password && <p className="text-xs text-danger">{errors.password.message}</p>}
      </div>

      {serverError && (
        <p className="rounded-md border border-danger-border bg-danger-soft px-3 py-2 text-sm text-danger">
          {serverError}
        </p>
      )}

      <button
        type="submit"
        disabled={login.isPending}
        aria-busy={login.isPending}
        className="btn btn-primary w-full"
      >
        <ButtonPending pending={login.isPending} onDark>
          {t("login")}
        </ButtonPending>
      </button>

      <p className="text-center text-sm text-muted">
        {t("noAccount")}{" "}
        <Link href="/register" className="link-accent">
          {t("register")}
        </Link>
      </p>
    </form>
  );
}
