import { NextResponse, type NextRequest } from "next/server";
import { checkWriteAccess, COOKIE } from "@/lib/auth";
import { lookupBarcode } from "@/lib/barcode";
import { cleanCode, getByCode, upsert } from "@/lib/products";
import { fetchObf } from "@/lib/obf";

export const dynamic = "force-dynamic";

/**
 * Cerca un codice a barre: prima nel database, poi in tempo reale su Open Beauty Facts.
 * Il prodotto trovato su Open Beauty Facts resta in cache nel database solo se le modifiche al catalogo
 * sono consentite (sessione valida, o sviluppo); in produzione senza APP_PASSWORD viene solo restituito.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const code = cleanCode((await params).code);
  if (code.length < 8) return NextResponse.json({ error: "Codice non valido" }, { status: 400 });
  const save = (await checkWriteAccess(req.cookies.get(COOKIE)?.value)).ok;
  const r = await lookupBarcode(code, save, { getByCode, fetchObf, upsert });
  if (r) return NextResponse.json(r);
  return NextResponse.json({ product: null, code }, { status: 404 });
}
