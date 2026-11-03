import { NextResponse, type NextRequest } from "next/server";
import { getByCode, getProduct, remove, upsert } from "@/lib/products";
import { isBarcode, lookupBarcode } from "@/lib/barcode";
import { fetchObf } from "@/lib/obf";
import { ProductBody } from "@/lib/schemas";
import { requireWriteAccess } from "@/lib/guard";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: NextRequest, { params }: Ctx) {
  const id = (await params).id;
  const p = await getProduct(id);
  if (p) return NextResponse.json(p);
  // Prodotto mostrato dopo una scansione ma non salvato (produzione senza APP_PASSWORD): lo si rilegge
  // da Open Beauty Facts, senza mai salvarlo da qui.
  if (isBarcode(id)) {
    const r = await lookupBarcode(id, false, { getByCode, fetchObf, upsert });
    if (r) return NextResponse.json(r.product);
  }
  return NextResponse.json({ error: "Prodotto non trovato" }, { status: 404 });
}

/** Modifica, oppure correzione di un prodotto del catalogo (diventa un prodotto dell'utente). */
export async function PUT(req: NextRequest, { params }: Ctx) {
  const denied = await requireWriteAccess(req);
  if (denied) return denied;
  const { id } = await params;
  const cur = await getProduct(id);
  if (!cur) return NextResponse.json({ error: "Prodotto non trovato" }, { status: 404 });
  const parsed = ProductBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dati non validi" }, { status: 400 });
  const p = await upsert({ ...parsed.data, id: cur.id, gtin: cur.gtin, origin: "user", imageUrl: cur.imageUrl, isItaly: cur.isItaly });
  return NextResponse.json(p);
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const denied = await requireWriteAccess(req);
  if (denied) return denied;
  await remove((await params).id);
  return NextResponse.json({ ok: true });
}
