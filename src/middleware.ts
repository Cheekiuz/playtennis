import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { getLocaleFromPathname, localePath } from "@/lib/i18n";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/config";

const PROTECTED_PATHS = ["/dashboard", "/en/dashboard"];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.includes(pathname);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  if (pathname === "/lt" || pathname.startsWith("/lt/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.replace(/^\/lt/, "") || "/";
    return NextResponse.redirect(url);
  }

  let response = NextResponse.next({ request });
  response.headers.set("x-locale", getLocaleFromPathname(pathname));

  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();

  if (url && key) {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          response.headers.set("x-locale", getLocaleFromPathname(pathname));
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (isProtectedPath(pathname) && !user) {
      const locale = getLocaleFromPathname(pathname);
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/auth/login";
      loginUrl.searchParams.set("next", localePath(locale, "/dashboard"));
      return NextResponse.redirect(loginUrl);
    }
  } else if (isProtectedPath(pathname)) {
    const locale = getLocaleFromPathname(pathname);
    return NextResponse.redirect(new URL(localePath(locale, "/"), request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
