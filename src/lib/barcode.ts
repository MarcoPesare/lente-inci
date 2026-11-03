import { summarize, type Mode } from "./inci/engine";
import type { Product, ProductInput } from "./products";

/** Accesso ai dati, passato come parametro: così la logica si può testare senza database né rete. */
export interface BarcodeDeps {
  getByCode(code: string): Promise<Product | null>;
  fetchObf(code: string): Promise<ProductInput | null>;
  upsert(input: ProductInput): Promise<Product>;
}

export type BarcodeResult = { product: Product; from: "db" | "obf"; saved: boolean };

/** I codici a barre hanno da 8 a 14 cifre. */
export const isBarcode = (s: string) => /^\d{8,14}$/.test(s);

/** Prodotto costruito dai dati di Open Beauty Facts senza salvarlo: stessi calcoli di upsert(), nessuna scrittura. */
export function transientProduct(input: ProductInput, now = new Date()): Product {
  const gtin = input.gtin ? String(input.gtin).replace(/\D/g, "") || null : null;
  const mode: Mode = input.mode === "leave" ? "leave" : "rinse";
  const s = summarize(input.inci ?? null, mode);
  return {
    id: input.id || gtin || "", gtin, name: input.name, brand: input.brand ?? "", category: input.category ?? "Altro", mode,
    inci: input.inci?.trim() || null, source: input.source ?? "", origin: input.origin ?? "obf", imageUrl: input.imageUrl ?? null,
    hasPhoto: false, photoAt: null, score: s.score, flags: s.flags, coverage: s.coverage, isItaly: input.isItaly ?? false,
    updatedAt: now.toISOString(),
  };
}

/**
 * Cerca un codice a barre: prima nel database, poi in tempo reale su Open Beauty Facts.
 * Il prodotto trovato su Open Beauty Facts si salva nel database solo se `save` è vero
 * (sessione valida, o sviluppo); altrimenti viene solo restituito.
 */
export async function lookupBarcode(code: string, save: boolean, deps: BarcodeDeps): Promise<BarcodeResult | null> {
  const local = await deps.getByCode(code);
  if (local) return { product: local, from: "db", saved: true };
  const remote = await deps.fetchObf(code);
  if (!remote) return null;
  if (save) return { product: await deps.upsert(remote), from: "obf", saved: true };
  return { product: transientProduct(remote), from: "obf", saved: false };
}
