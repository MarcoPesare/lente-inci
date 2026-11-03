import { NextResponse, type NextRequest } from "next/server";
import { checkWriteAccess, COOKIE } from "./auth";

/** Da chiamare all'inizio delle route che scrivono nel catalogo: restituisce la risposta di errore, o null se si può procedere. */
export async function requireWriteAccess(req: NextRequest): Promise<NextResponse | null> {
  const r = await checkWriteAccess(req.cookies.get(COOKIE)?.value);
  return r.ok ? null : NextResponse.json({ error: r.error }, { status: r.status });
}
