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
        <label htmlFor="name" className="text-sm font-medium text-zinc-800">
          {tCommon("nameOptional")}
        </label>
        <input
          id="name"
          type="text"
          autoComplete="name"
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
          {...register("name")}
        />
        {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
      </div>

      <div className="space-y-1">
        <label htmlFor="email" className="text-sm font-medium text-zinc-800">
          {tCommon("email")}
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
          {...register("email")}
        />
        {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
      </div>

      <div className="space-y-1">
        <label htmlFor="password" className="text-sm font-medium text-zinc-800">
          {tCommon("password")}
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
          {...register("password")}
        />
        {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
      </div>

      {serverError && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {serverError}
        </p>
      )}

      <button
        type="submit"
        disabled={registerMutation.isPending}
        aria-busy={registerMutation.isPending}
        className="rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition hover:bg-accent-hover disabled:opacity-60"
      >
        <ButtonPending pending={registerMutation.isPending} onDark>
          {t("register")}
        </ButtonPending>
      </button>

      <p className="text-center text-sm text-zinc-600">
        {t("hasAccount")}{" "}
        <Link href="/login" className="font-medium text-teal-800 underline-offset-2 hover:underline">
          {t("login")}
        </Link>
      </p>
    </form>
  );
}
