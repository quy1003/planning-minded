"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@tripmind/shared";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { ApiError } from "@/lib/api-client";
import { useLogin } from "../hooks";

export function LoginForm() {
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
        ? "Đăng nhập thất bại"
        : null;

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={handleSubmit((values) => login.mutate(values))}
      noValidate
    >
      <div className="space-y-1">
        <label htmlFor="email" className="text-sm font-medium text-zinc-800">
          Email
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
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
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
        disabled={login.isPending}
        className="rounded-md bg-teal-800 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-teal-900 disabled:opacity-60"
      >
        {login.isPending ? "Đang đăng nhập…" : "Đăng nhập"}
      </button>

      <p className="text-center text-sm text-zinc-600">
        Chưa có tài khoản?{" "}
        <Link href="/register" className="font-medium text-teal-800 underline-offset-2 hover:underline">
          Đăng ký
        </Link>
      </p>
    </form>
  );
}
