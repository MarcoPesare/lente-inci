import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const r = await sql`SELECT data, mime, updated_at FROM photos WHERE product_id = ${(await params).id}`;
  if (!r[0]) return new Response("Foto non trovata", { status: 404 });
  const etag = `"${new Date(r[0].updated_at).getTime()}"`;
  if (req.headers.get("if-none-match") === etag) return new Response(null, { status: 304 });
  return new Response(new Uint8Array(r[0].data), {
    headers: { "Content-Type": r[0].mime, "Cache-Control": "private, max-age=86400", ETag: etag },
  });
}
