export { auth as middleware } from "./auth";

export const config = {
  matcher: [
    /*
     * Protegge tutte le route eccetto:
     * - /login, /register (pagine auth pubbliche)
     * - /api/auth/* (handler NextAuth)
     * - /_next (asset Next.js)
     * - /uploads/* (file statici upload)
     * - file statici (favicon, ecc.)
     */
    "/((?!login|register|api/auth|_next/static|_next/image|uploads|favicon.ico|robots.txt).*)",
  ],
};

