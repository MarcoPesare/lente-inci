import { NextResponse, type NextRequest } from "next/server";
import { alternatives, getProduct } from "@/lib/products";
import type { Flag } from "@/lib/inci/engine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const p = await getProduct((await params).id);
  if (!p) return NextResponse.json({ items: [] });
  const avoid = (req.nextUrl.searchParams.get("avoid") ?? "").split(",").filter(Boolean) as Flag[];
  return NextResponse.json({ items: await alternatives(p, avoid, 6) });
}
