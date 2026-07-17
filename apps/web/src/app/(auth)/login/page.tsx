import { LoginForm } from "@/features/auth/components/login-form";

export default function LoginPage() {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Đăng nhập</h1>
      <LoginForm />
      <p className="mt-6 text-xs text-zinc-500">
        Demo: <code className="rounded bg-zinc-100 px-1">demo@tripmind.local</code> /{" "}
        <code className="rounded bg-zinc-100 px-1">password123</code>
      </p>
    </div>
  );
}
