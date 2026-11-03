import { NextResponse, type NextRequest } from "next/server";
import { AuthConfigError, COOKIE, createSession, SESSION_TTL_SECONDS } from "@/lib/auth";
import { passwordMatches } from "@/lib/password";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const next = String(form?.get("next") || "/");
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";
  const back = (error: string) => NextResponse.redirect(new URL(`/login?error=${error}&next=${encodeURIComponent(safeNext)}`, req.url), 303);
  let token: string | null;
  try {
    if (!passwordMatches(form?.get("password"), process.env.APP_PASSWORD)) return back("1");
    token = await createSession();
  } catch (e) {
    if (!(e instanceof AuthConfigError)) throw e;
    return back("config");
  }
  if (!token) return back("1");
  const res = NextResponse.redirect(new URL(safeNext, req.url), 303);
  res.cookies.set(COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: SESSION_TTL_SECONDS });
  return res;
}
