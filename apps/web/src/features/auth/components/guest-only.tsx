"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useMe } from "../hooks";

/** Trang login/register: đã có session → /trips. */
export function GuestOnly({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { data: user, isLoading } = useMe();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/trips");
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-zinc-600">
        Đang tải…
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-zinc-600">
        Đang chuyển vào app…
      </div>
    );
  }

  return <>{children}</>;
}
