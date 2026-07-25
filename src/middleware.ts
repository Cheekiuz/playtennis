import { type NextRequest, NextResponse } from "next/server";
import { getLocaleFromPathname } from "@/lib/i18n";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // /lt is an alias — Lithuanian lives at /
  if (pathname === "/lt" || pathname.startsWith("/lt/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.replace(/^\/lt/, "") || "/";
    return NextResponse.redirect(url);
  }

  const response = NextResponse.next();
  response.headers.set("x-locale", getLocaleFromPathname(pathname));
  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
