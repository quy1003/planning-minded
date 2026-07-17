"use client";

import { useMe } from "../hooks";

export function AppShellUser() {
  const { data: user } = useMe();
  if (!user) return null;
  return <span className="hidden text-sm text-muted sm:inline">{user.name ?? user.email}</span>;
}
