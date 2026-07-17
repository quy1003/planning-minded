"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { BrandMark } from "@/components/brand-mark";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { Link } from "@/i18n/navigation";

const navIds = ["features", "how", "pricing"] as const;

export function LandingHeader() {
  const t = useTranslations("Landing");
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-6">
        <Link href="/" className="shrink-0" onClick={() => setOpen(false)}>
          <BrandMark />
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-muted md:flex">
          {navIds.map((id) => (
            <a key={id} href={`#${id}`} className="transition hover:text-foreground">
              {t(`nav.${id}`)}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <LocaleSwitcher />
          <ThemeToggle />
          <Link
            href="/login"
            className="rounded-lg px-3 py-2 text-sm font-medium text-foreground transition hover:bg-accent-soft"
          >
            {t("nav.signIn")}
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-accent px-3.5 py-2 text-sm font-medium text-accent-foreground transition hover:bg-accent-hover"
          >
            {t("nav.getStarted")}
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex size-9 items-center justify-center rounded-lg border border-border md:hidden"
          aria-expanded={open}
          aria-label={t("nav.menu")}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">{t("nav.menu")}</span>
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </div>

      {open ? (
        <div className="border-t border-border px-6 py-4 md:hidden">
          <nav className="flex flex-col gap-3 text-sm">
            {navIds.map((id) => (
              <a
                key={id}
                href={`#${id}`}
                className="text-muted hover:text-foreground"
                onClick={() => setOpen(false)}
              >
                {t(`nav.${id}`)}
              </a>
            ))}
          </nav>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <LocaleSwitcher />
            <ThemeToggle />
            <Link
              href="/login"
              className="rounded-lg px-3 py-2 text-sm font-medium"
              onClick={() => setOpen(false)}
            >
              {t("nav.signIn")}
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-accent px-3.5 py-2 text-sm font-medium text-accent-foreground"
              onClick={() => setOpen(false)}
            >
              {t("nav.getStarted")}
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
