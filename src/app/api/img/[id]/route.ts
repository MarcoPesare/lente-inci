import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { isAllowedImageUrl, largerObfUrl, normalizeThumb } from "@/lib/image";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Da cambiare quando cambia normalizeThumb: rigenera tutte le miniature.
const PIPELINE = "t2";
const MAX_BYTES = 8 * 1024 * 1024;

/**
 * Miniatura quadrata del prodotto, sempre uguale per forma e dimensione.
 * Viene generata al primo accesso (dalla foto dell'utente o dall'immagine del catalogo) e salvata nel database.
 */
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;
  const r = await sql`SELECT p.image_url, ph.updated_at AS photo_at, t.src AS thumb_src, t.data AS thumb
    FROM products p LEFT JOIN photos ph ON ph.product_id = p.id LEFT JOIN thumbs t ON t.product_id = p.id
    WHERE p.id = ${id}`;
  const row = r[0];
  if (!row) return new Response("Prodotto non trovato", { status: 404 });

  const src = row.photo_at ? `${PIPELINE}:photo:${new Date(row.photo_at).getTime()}` : row.image_url ? `${PIPELINE}:${row.image_url}` : null;
  if (!src) return new Response("Nessuna immagine", { status: 404 });
  if (row.thumb_src === src) return image(row.thumb);

  const original = row.photo_at ? await photoData(id) : await download(row.image_url);
  if (!original) return new Response("Immagine non disponibile", { status: 502 });
  let data: Buffer;
  try {
    data = await normalizeThumb(original);
  } catch {
    return new Response("Immagine non leggibile", { status: 415 });
  }
  await sql`INSERT INTO thumbs (product_id, src, data, updated_at) VALUES (${id}, ${src}, ${data}, now())
    ON CONFLICT (product_id) DO UPDATE SET src = EXCLUDED.src, data = EXCLUDED.data, updated_at = now()`;
  return image(data);
}

function image(data: Uint8Array) {
  // l'URL contiene la versione (?v=...), quindi il browser può tenerla a lungo
  return new Response(new Uint8Array(data), {
    headers: { "Content-Type": "image/webp", "Cache-Control": "private, max-age=31536000, immutable" },
  });
}

async function photoData(id: string): Promise<Buffer | null> {
  const r = await sql`SELECT data FROM photos WHERE product_id = ${id}`;
  return r[0] ? Buffer.from(r[0].data) : null;
}

/** Scarica l'immagine del catalogo, preferendo la versione a 400 px. */
async function download(url: string): Promise<Buffer | null> {
  if (!isAllowedImageUrl(url)) return null;
  for (const u of [...new Set([largerObfUrl(url), url])]) {
    try {
      const res = await fetch(u, {
        headers: { "User-Agent": process.env.OBF_USER_AGENT ?? "LenteINCI/0.1 (beta)" },
        signal: AbortSignal.timeout(8000),
        cache: "no-store",
      });
      if (!res.ok || !(res.headers.get("content-type") ?? "").startsWith("image/")) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length > 0 && buf.length <= MAX_BYTES) return buf;
    } catch { /* prova l'URL successivo */ }
  }
  return null;
}
