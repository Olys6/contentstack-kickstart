import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LANG, LANGS } from "@/lib/i18n";

// Every page lives under /fr or /en. Anything else lands on French: the site
// is Geneva-first, and the header switch is one click away.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasLang = Object.keys(LANGS).some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`));
  if (hasLang) return;

  request.nextUrl.pathname = `/${DEFAULT_LANG}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|.*\\..*).*)"],
};
