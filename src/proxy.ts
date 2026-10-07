import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import {
  getLocaleFromPathname,
  internalPathname,
  localeCookieName,
  preferredLocale,
  publicRedirectPath,
  type Locale,
} from "@/lib/i18n";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/config";

function withLocale(request: NextRequest, locale: Locale) {
  const headers = new Headers(request.headers);
  headers.set("x-locale", locale);
  return headers;
}

function rememberLocale(response: NextResponse, locale: Locale) {
  response.cookies.set(localeCookieName, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  response.headers.set("x-locale", locale);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api") || pathname.startsWith("/_next") || pathname.includes(".")) {
    return NextResponse.next();
  }

  if (pathname === "/") {
    const locale = preferredLocale(
      request.headers.get("accept-language"),
      request.cookies.get(localeCookieName)?.value,
    );
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}`;
    const response = NextResponse.redirect(url, 302);
    rememberLocale(response, locale);
    return response;
  }

  const redirected = publicRedirectPath(pathname);
  if (redirected) {
    const url = request.nextUrl.clone();
    url.pathname = redirected;
    return NextResponse.redirect(url, 301);
  }

  const locale = getLocaleFromPathname(pathname);
  const requestHeaders = withLocale(request, locale);
  const internal = internalPathname(pathname);
  const needsRewrite = internal !== null && internal !== pathname;

  let response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  const supabaseUrl = getSupabaseUrl();
  const supabaseKey = getSupabaseAnonKey();
  if (supabaseUrl && supabaseKey) {
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({
            request: { headers: requestHeaders },
          });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    });

    await supabase.auth.getUser();
  }

  if (needsRewrite && internal) {
    const url = request.nextUrl.clone();
    url.pathname = internal;
    const rewritten = NextResponse.rewrite(url, {
      request: { headers: requestHeaders },
    });
    for (const cookie of response.cookies.getAll()) {
      rewritten.cookies.set(cookie);
    }
    rememberLocale(rewritten, locale);
    return rewritten;
  }

  rememberLocale(response, locale);
  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
