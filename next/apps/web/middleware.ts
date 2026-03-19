import { auth } from "./auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { DEFAULT_LOCALE } from "./i18n/locales";

export async function middleware(request: NextRequest) {
  // Prima esegui l'auth check
  const authResult = await (auth as any)(request);

  // Se auth ha restituito un redirect, rispettalo
  if (authResult && authResult.status && authResult.status >= 300 && authResult.status < 400) {
    return authResult;
  }

  // Propaga il cookie di locale se già presente, altrimenti imposta il default
  const response = authResult instanceof NextResponse ? authResult : NextResponse.next();
  if (!request.cookies.get("koillection_locale")) {
    response.cookies.set("koillection_locale", DEFAULT_LOCALE, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Protegge tutte le route eccetto:
     * - /login, /register (pagine auth pubbliche)
     * - /user/* (viste condivise pubbliche)
     * - /api/auth/* (handler NextAuth)
     * - /_next (asset Next.js)
     * - /uploads/* (file statici upload)
     * - file statici (favicon, ecc.)
     */
    "/((?!login|register|user|api/auth|_next/static|_next/image|uploads|favicon.ico|robots.txt).*)",
  ],
};
