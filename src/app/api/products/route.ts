import { NextResponse, type NextRequest } from "next/server";
import { search, upsert, getByCode, getMany } from "@/lib/products";
import { ProductBody } from "@/lib/schemas";
import { requireWriteAccess } from "@/lib/guard";
import type { Flag } from "@/lib/inci/engine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const ids = sp.get("ids");
  if (ids) return NextResponse.json({ items: await getMany(ids.split(",").filter(Boolean).slice(0, 100)), total: null });
  const res = await search({
    q: sp.get("q") ?? "",
    category: sp.get("cat") || undefined,
    sort: sp.get("sort") === "name" ? "name" : "score",
    limit: Number(sp.get("limit") ?? 30),
    offset: Number(sp.get("offset") ?? 0),
    avoidFlags: (sp.get("avoid") ?? "").split(",").filter(Boolean) as Flag[],
    onlyWithInci: sp.get("inci") === "1",
  });
  return NextResponse.json(res);
}

export async function POST(req: NextRequest) {
  const denied = await requireWriteAccess(req);
  if (denied) return denied;
  const parsed = ProductBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dati non validi" }, { status: 400 });
  const b = parsed.data;
  const gtin = b.gtin || null;
  if (gtin) {
    const existing = await getByCode(gtin);
    if (existing && existing.origin === "user") return NextResponse.json({ error: "Esiste già un prodotto con questo codice a barre.", id: existing.id }, { status: 409 });
  }
  const p = await upsert({ ...b, gtin, id: gtin ?? undefined, origin: "user" });
  return NextResponse.json(p, { status: 201 });
}
