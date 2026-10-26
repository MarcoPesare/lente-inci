import { NextResponse, type NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import sharp from "sharp";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PROMPT =
  "Questa è la foto dell'etichetta di un prodotto cosmetico. Trascrivi la lista ingredienti (INCI) esattamente come è stampata, nello stesso ordine, separando gli ingredienti con una virgola e uno spazio. Non tradurre, non correggere, non aggiungere ingredienti che non leggi. Se leggi anche il nome del prodotto e la marca, riportali. Se non trovi una lista ingredienti, lascia inci vuoto. Rispondi solo con JSON valido, senza altro testo: {\"inci\": string, \"name\": string, \"brand\": string}";

/** Legge l'INCI da una foto dell'etichetta con Claude (serve ANTHROPIC_API_KEY). */
export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: "Lettura da foto non configurata sul server." }, { status: 501 });
  const form = await req.formData().catch(() => null);
  const file = form?.get("photo");
  if (!(file instanceof Blob)) return NextResponse.json({ error: "Nessuna foto ricevuta" }, { status: 400 });
  try {
    const jpeg = await sharp(Buffer.from(await file.arrayBuffer()), { failOn: "none" }).rotate()
      .resize(1600, 1600, { fit: "inside", withoutEnlargement: true }).jpeg({ quality: 85 }).toBuffer();
    const client = new Anthropic();
    const msg = await client.messages.create({
      model: process.env.OCR_MODEL || "claude-sonnet-5-5",
      max_tokens: 2000,
      messages: [{ role: "user", content: [
        { type: "image", source: { type: "base64", media_type: "image/jpeg", data: jpeg.toString("base64") } },
        { type: "text", text: PROMPT },
      ] }],
    });
    const text = msg.content.map((c) => (c.type === "text" ? c.text : "")).join("");
    const json = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
    const inci = String(json.inci ?? "").trim();
    if (!inci) return NextResponse.json({ error: "Non trovo una lista ingredienti nella foto. Inquadra solo la scritta Ingredients o INCI, con buona luce." }, { status: 422 });
    return NextResponse.json({ inci, name: String(json.name ?? "").trim(), brand: String(json.brand ?? "").trim() });
  } catch {
    return NextResponse.json({ error: "Lettura non riuscita. Riprova con una foto più nitida, oppure incolla il testo." }, { status: 502 });
  }
}
