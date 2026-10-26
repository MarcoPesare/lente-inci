import { categorize } from "./categorize";
import type { ProductInput } from "./products";

/**
 * Ricerca in tempo reale su Open Beauty Facts (dati aperti, licenza ODbL).
 * Usata quando un codice a barre non è nel database locale.
 */
export async function fetchObf(code: string): Promise<ProductInput | null> {
  if (process.env.OBF_LIVE_LOOKUP === "false") return null;
  const url = `https://world.openbeautyfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=code,product_name,product_name_it,generic_name,brands,categories_tags,ingredients_text,ingredients_text_it,image_front_small_url,image_small_url,countries_tags`;
  try {
    const r = await fetch(url, {
      headers: { "User-Agent": process.env.OBF_USER_AGENT ?? "LenteINCI/0.1 (beta)" },
      signal: AbortSignal.timeout(6000),
      next: { revalidate: 86400 },
    });
    if (!r.ok) return null;
    const j = await r.json();
    if (j.status !== 1 || !j.product) return null;
    const p = j.product;
    const name = (p.product_name_it || p.product_name || p.generic_name || "").trim();
    const brand = String(p.brands || "").split(",")[0].trim();
    const inci = (p.ingredients_text_it || p.ingredients_text || "").trim() || null;
    const { category, mode } = categorize((p.categories_tags || []).join(" "), name);
    return {
      gtin: String(p.code || code), name: name || (brand ? `${brand} (senza nome)` : "Prodotto senza nome"),
      brand, category, mode, inci, source: "Open Beauty Facts", origin: "obf",
      imageUrl: p.image_front_small_url || p.image_small_url || null,
      isItaly: (p.countries_tags || []).includes("en:italy"),
    };
  } catch {
    return null;
  }
}
