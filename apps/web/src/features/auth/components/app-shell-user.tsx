"use client";

import { useMe } from "../hooks";

export function AppShellUser() {
  const { data: user } = useMe();
  if (!user) return null;
  return <span className="text-sm text-zinc-600">{user.name ?? user.email}</span>;
}
