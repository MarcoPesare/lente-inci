import { NextResponse, type NextRequest } from "next/server";
import { cleanCode, getByCode, upsert } from "@/lib/products";
import { fetchObf } from "@/lib/obf";

export const dynamic = "force-dynamic";

/** Cerca un codice a barre: prima nel database, poi in tempo reale su Open Beauty Facts. */
export async function GET(_: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const code = cleanCode((await params).code);
  if (code.length < 8) return NextResponse.json({ error: "Codice non valido" }, { status: 400 });
  const local = await getByCode(code);
  if (local) return NextResponse.json({ product: local, from: "db" });
  const remote = await fetchObf(code);
  if (remote) {
    const p = await upsert(remote); // il prodotto resta in cache nel database
    return NextResponse.json({ product: p, from: "obf" });
  }
  return NextResponse.json({ product: null, code }, { status: 404 });
}
