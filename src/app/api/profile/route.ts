import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import { emptyProfile } from "@/lib/inci/engine";

export const dynamic = "force-dynamic";

/**
 * Un profilo per dispositivo, legato a un identificativo casuale in un cookie tecnico (nessun account, nessun dato
 * identificativo). I profili inattivi da più di 12 mesi vengono cancellati.
 */
const COOKIE = "li_pid";
const MAX_AGE = 60 * 60 * 24 * 365;
const RETENTION = "12 months";

const Body = z.object({
  favorites: z.array(z.string().max(80)).max(500),
  history: z.array(z.string().max(80)).max(50),
  avoidFlags: z.array(z.string().max(8)).max(20),
  avoidIngr: z.array(z.string().max(120)).max(200),
});

const pid = (req: NextRequest) => {
  const v = req.cookies.get(COOKIE)?.value;
  return v && /^[0-9a-f-]{36}$/.test(v) ? v : null;
};

function withCookie(res: NextResponse, id: string) {
  res.cookies.set(COOKIE, id, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: MAX_AGE });
  return res;
}

export async function GET(req: NextRequest) {
  const id = pid(req);
  const r = id ? await sql`SELECT data FROM profiles WHERE id = ${id}` : [];
  // stored = false: il server non ha ancora nulla, il browser può inviare la copia che ha in locale
  const res = NextResponse.json({ ...emptyProfile(), ...(r[0]?.data ?? {}), stored: !!r[0] });
  return id ? withCookie(res, id) : res;
}

export async function PUT(req: NextRequest) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Profilo non valido" }, { status: 400 });
  const id = pid(req) ?? crypto.randomUUID();
  await sql`INSERT INTO profiles (id, data, updated_at) VALUES (${id}, ${sql.json(parsed.data)}, now())
    ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`;
  if (Math.random() < 0.02) await sql`DELETE FROM profiles WHERE updated_at < now() - ${RETENTION}::interval`;
  return withCookie(NextResponse.json({ ok: true }), id);
}

/** Diritto alla cancellazione: elimina il profilo dal server e il cookie. */
export async function DELETE(req: NextRequest) {
  const id = pid(req);
  if (id) await sql`DELETE FROM profiles WHERE id = ${id}`;
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(COOKIE);
  return res;
}
