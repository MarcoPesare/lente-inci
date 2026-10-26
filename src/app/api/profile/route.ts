import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import { emptyProfile } from "@/lib/inci/engine";

export const dynamic = "force-dynamic";
// Beta con un solo utente: un profilo unico condiviso tra i dispositivi.
const ID = "default";

const Body = z.object({
  favorites: z.array(z.string().max(80)).max(500),
  history: z.array(z.string().max(80)).max(50),
  avoidFlags: z.array(z.string().max(8)).max(20),
  avoidIngr: z.array(z.string().max(120)).max(200),
});

export async function GET() {
  const r = await sql`SELECT data FROM profiles WHERE id = ${ID}`;
  return NextResponse.json({ ...emptyProfile(), ...(r[0]?.data ?? {}) });
}

export async function PUT(req: NextRequest) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Profilo non valido" }, { status: 400 });
  await sql`INSERT INTO profiles (id, data, updated_at) VALUES (${ID}, ${sql.json(parsed.data)}, now())
    ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`;
  return NextResponse.json({ ok: true });
}
