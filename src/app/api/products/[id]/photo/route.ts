import { NextResponse, type NextRequest } from "next/server";
import sharp from "sharp";
import { sql } from "@/lib/db";
import { getProduct } from "@/lib/products";
import { checkContentLength, checkImageUpload } from "@/lib/upload";
import { requireWriteAccess } from "@/lib/guard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Riceve una foto, la ridimensiona a 480 px e la salva in WebP (circa 20-40 KB). */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireWriteAccess(req);
  if (denied) return denied;
  const p = await getProduct((await params).id);
  if (!p) return NextResponse.json({ error: "Prodotto non trovato" }, { status: 404 });
  const len = checkContentLength(req.headers.get("content-length"));
  if (!len.ok) return NextResponse.json({ error: len.error }, { status: len.status });
  const form = await req.formData().catch(() => null);
  const file = form?.get("photo");
  const check = await checkImageUpload(file);
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });
  if (!(file instanceof Blob)) return NextResponse.json({ error: "Nessuna foto ricevuta" }, { status: 400 });
  try {
    const img = sharp(Buffer.from(await file.arrayBuffer()), { failOn: "none" }).rotate().resize(480, 480, { fit: "inside", withoutEnlargement: true });
    const { data, info } = await img.webp({ quality: 78, effort: 5 }).toBuffer({ resolveWithObject: true });
    await sql`INSERT INTO photos (product_id, data, mime, width, height, bytes, updated_at)
      VALUES (${p.id}, ${data}, 'image/webp', ${info.width}, ${info.height}, ${data.length}, now())
      ON CONFLICT (product_id) DO UPDATE SET data = EXCLUDED.data, mime = EXCLUDED.mime, width = EXCLUDED.width,
        height = EXCLUDED.height, bytes = EXCLUDED.bytes, updated_at = now()`;
    return NextResponse.json({ ok: true, bytes: data.length, width: info.width, height: info.height });
  } catch {
    return NextResponse.json({ error: "Immagine non leggibile: prova con una foto JPEG o PNG." }, { status: 415 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireWriteAccess(req);
  if (denied) return denied;
  await sql`DELETE FROM photos WHERE product_id = ${(await params).id}`;
  return NextResponse.json({ ok: true });
}
