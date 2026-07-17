import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

/**
 * 1) next-intl: `/` → `/vi`, giữ locale trong URL.
 * 2) Session gate: `/[locale]/trips` không có cookie → `/[locale]/login`.
 */
export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSessionCookie = request.cookies.has("tripmind.sid");

  const segments = pathname.split("/").filter(Boolean);
  const maybeLocale = segments[0];
  const locale = routing.locales.includes(maybeLocale as "vi" | "en")
    ? maybeLocale
    : routing.defaultLocale;
  const pathWithoutLocale =
    routing.locales.includes(maybeLocale as "vi" | "en")
      ? `/${segments.slice(1).join("/")}`
      : pathname;
  const normalizedPath = pathWithoutLocale === "/" ? "/" : pathWithoutLocale.replace(/\/$/, "") || "/";

  if (normalizedPath.startsWith("/trips") && !hasSessionCookie) {
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
  }

  return intlMiddleware(request);
}

export const config = {
  // Bỏ qua API rewrite, static, _next
  matcher: ["/", "/(vi|en)/:path*", "/((?!api|_next|_vercel|.*\\..*).*)"],
};
