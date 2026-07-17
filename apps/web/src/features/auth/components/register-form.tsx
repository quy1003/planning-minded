"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema } from "@tripmind/shared";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ButtonPending } from "@/components/ui/button-pending";
import { Link } from "@/i18n/navigation";
import { ApiError } from "@/lib/api-client";
import { useRegister } from "../hooks";

/** Form cho phép name rỗng; API chỉ nhận name khi có nội dung. */
const registerFormSchema = z.object({
  email: registerSchema.shape.email,
  password: registerSchema.shape.password,
  name: z.string().max(100).optional(),
});

type RegisterFormValues = z.infer<typeof registerFormSchema>;

export function RegisterForm() {
  const t = useTranslations("Auth");
  const tCommon = useTranslations("Common");
  const registerMutation = useRegister();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: { email: "", password: "", name: "" },
  });

  const serverError =
    registerMutation.error instanceof ApiError
      ? registerMutation.error.message
      : registerMutation.error
        ? t("registerFailed")
        : null;

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={handleSubmit((values) => {
        const name = values.name?.trim();
        registerMutation.mutate({
          email: values.email,
          password: values.password,
          ...(name ? { name } : {}),
        });
      })}
      noValidate
    >
      <div className="space-y-1">
        <label htmlFor="name" className="text-sm font-medium text-foreground">
          {tCommon("nameOptional")}
        </label>
        <input id="name" type="text" autoComplete="name" className="input-field" {...register("name")} />
        {errors.name && <p className="text-xs text-danger">{errors.name.message}</p>}
      </div>

      <div className="space-y-1">
        <label htmlFor="email" className="text-sm font-medium text-foreground">
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
        <label htmlFor="password" className="text-sm font-medium text-foreground">
          {tCommon("password")}
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
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
        disabled={registerMutation.isPending}
        aria-busy={registerMutation.isPending}
        className="btn btn-primary w-full"
      >
        <ButtonPending pending={registerMutation.isPending} onDark>
          {t("register")}
        </ButtonPending>
      </button>

      <p className="text-center text-sm text-muted">
        {t("hasAccount")}{" "}
        <Link href="/login" className="link-accent">
          {t("login")}
        </Link>
      </p>
    </form>
  );
}
