import { NextResponse, type NextRequest } from "next/server";

/**
 * Gate nhẹ theo cookie `tripmind.sid`.
 * Không redirect login→trips khi có cookie: cookie có thể stale → tránh vòng lặp
 * với RequireAuth (401 → /login). GuestOnly gọi /auth/me để quyết định.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSessionCookie = request.cookies.has("tripmind.sid");

  if (pathname === "/") {
    return NextResponse.redirect(new URL(hasSessionCookie ? "/trips" : "/login", request.url));
  }

  if (pathname.startsWith("/trips") && !hasSessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/trips/:path*"],
};
