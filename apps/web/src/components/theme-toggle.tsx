"use client";

import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

function subscribe() {
  return () => {};
}

/** true trên client sau hydrate; false trên server. */
function useIsClient() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}

/** Toggle light / dark. */
export function ThemeToggle({ className }: { className?: string }) {
  const t = useTranslations("Theme");
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useIsClient();

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label={t("toggle")}
        className={`inline-flex size-9 items-center justify-center rounded-lg border border-border bg-surface ${className ?? ""}`}
      />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      aria-label={t("toggle")}
      title={isDark ? t("light") : t("dark")}
      className={`inline-flex size-9 items-center justify-center rounded-lg border border-border bg-surface text-foreground transition hover:bg-accent-soft ${className ?? ""}`}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? (
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M21 14.5A8.5 8.5 0 0110.5 3 7 7 0 1019 16.5c.7-.6 1.4-1.3 2-2z" />
        </svg>
      )}
    </button>
  );
}
