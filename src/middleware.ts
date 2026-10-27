import { NextResponse, type NextRequest } from "next/server";
import { COOKIE, sessionToken } from "./lib/auth";

export async function middleware(req: NextRequest) {
  const token = await sessionToken();
  if (!token) return NextResponse.next(); // password non impostata: app aperta
  if (req.cookies.get(COOKIE)?.value === token) return NextResponse.next();
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Accesso richiesto" }, { status: 401 });
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = pathname === "/" ? "" : `?next=${encodeURIComponent(pathname + req.nextUrl.search)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!login|privacy|api/login|_next/|icons/|manifest.webmanifest|sw.js|favicon.ico).*)"],
};
