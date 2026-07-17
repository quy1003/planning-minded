"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useMe } from "../hooks";

/** Chặn route app: chờ /auth/me; 401 → /login. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { data: user, isLoading, isError, error } = useMe();

  useEffect(() => {
    if (!isLoading && user === null) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-zinc-600">
        Đang kiểm tra phiên đăng nhập…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 text-sm text-red-700">
        Lỗi tải phiên: {error instanceof Error ? error.message : "unknown"}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-zinc-600">
        Đang chuyển tới đăng nhập…
      </div>
    );
  }

  return <>{children}</>;
}
