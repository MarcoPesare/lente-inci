import { NextResponse, type NextRequest } from "next/server";
import { getProduct, remove, upsert } from "@/lib/products";
import { ProductBody } from "@/lib/schemas";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: NextRequest, { params }: Ctx) {
  const p = await getProduct((await params).id);
  return p ? NextResponse.json(p) : NextResponse.json({ error: "Prodotto non trovato" }, { status: 404 });
}

/** Modifica, oppure correzione di un prodotto del catalogo (diventa un prodotto dell'utente). */
export async function PUT(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const cur = await getProduct(id);
  if (!cur) return NextResponse.json({ error: "Prodotto non trovato" }, { status: 404 });
  const parsed = ProductBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dati non validi" }, { status: 400 });
  const p = await upsert({ ...parsed.data, id: cur.id, gtin: cur.gtin, origin: "user", imageUrl: cur.imageUrl, isItaly: cur.isItaly });
  return NextResponse.json(p);
}

export async function DELETE(_: NextRequest, { params }: Ctx) {
  await remove((await params).id);
  return NextResponse.json({ ok: true });
}
