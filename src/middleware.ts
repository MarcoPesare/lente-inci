import { NextResponse, type NextRequest } from "next/server";
import { authEnabled, AuthConfigError, COOKIE, verifySession } from "./lib/auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  try {
    if (!authEnabled()) return NextResponse.next(); // password non impostata: app aperta
    if (await verifySession(req.cookies.get(COOKIE)?.value)) return NextResponse.next();
  } catch (e) {
    // password impostata ma APP_SECRET non valido: l'app resta chiusa
    if (!(e instanceof AuthConfigError)) throw e;
    if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Configurazione incompleta: APP_SECRET non valido" }, { status: 503 });
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "?error=config";
    return NextResponse.redirect(url);
  }
  if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Accesso richiesto" }, { status: 401 });
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = pathname === "/" ? "" : `?next=${encodeURIComponent(pathname + req.nextUrl.search)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!login|privacy|api/login|_next/|icons/|manifest.webmanifest|sw.js|favicon.ico).*)"],
};
