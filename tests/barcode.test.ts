import { test } from "node:test";
import assert from "node:assert/strict";
import { lookupBarcode, transientProduct, type BarcodeDeps } from "../src/lib/barcode";
import { checkWriteAccess, createSession } from "../src/lib/auth";
import type { Product, ProductInput } from "../src/lib/products";

const OBF: ProductInput = {
  gtin: "3606000537675", name: "Hydrating Facial Cleanser", brand: "CeraVe", category: "Viso", mode: "rinse",
  inci: "Aqua, Glycerin, Cetearyl Alcohol, Phenoxyethanol", source: "Open Beauty Facts", origin: "obf",
  imageUrl: "https://images.openbeautyfacts.org/images/products/360/600/053/7675/front_it.3.200.jpg", isItaly: false,
};

/** Database e Open Beauty Facts finti: registrano ogni scrittura. */
function fakeDeps(inDb: Product | null = null) {
  const writes: ProductInput[] = [];
  const deps: BarcodeDeps = {
    getByCode: async () => inDb,
    fetchObf: async (code) => (code === OBF.gtin ? OBF : null),
    upsert: async (input) => { writes.push(input); return { ...transientProduct(input), updatedAt: "salvato" }; },
  };
  return { deps, writes };
}

/** Come la route: si salva solo se le modifiche al catalogo sono consentite. */
async function scan(code: string, cookie: string | undefined, env: Record<string, string | undefined>, deps: BarcodeDeps) {
  return lookupBarcode(code, (await checkWriteAccess(cookie, env)).ok, deps);
}

test("codice a barre: in produzione senza APP_PASSWORD il prodotto è restituito ma non salvato", async () => {
  const { deps, writes } = fakeDeps();
  const r = await scan(OBF.gtin!, undefined, { NODE_ENV: "production" }, deps);
  assert.equal(writes.length, 0);
  assert.equal(r?.saved, false);
  assert.equal(r?.from, "obf");
  assert.equal(r?.product.id, "3606000537675");
  assert.equal(r?.product.name, "Hydrating Facial Cleanser");
  assert.equal(r?.product.hasPhoto, false);
  assert.equal(typeof r?.product.score, "number"); // voto calcolato come per i prodotti salvati
});

test("codice a barre: con una sessione valida, o in sviluppo, il prodotto viene salvato", async () => {
  const env = { NODE_ENV: "production", APP_PASSWORD: "pw", APP_SECRET: "s".repeat(48) };
  const withSession = fakeDeps();
  const r1 = await scan(OBF.gtin!, (await createSession(env))!, env, withSession.deps);
  assert.equal(withSession.writes.length, 1);
  assert.equal(r1?.saved, true);

  const dev = fakeDeps();
  const r2 = await scan(OBF.gtin!, undefined, { NODE_ENV: "development" }, dev.deps);
  assert.equal(dev.writes.length, 1);
  assert.equal(r2?.saved, true);
});

test("codice a barre: già nel database non si scarica né si salva; sconosciuto restituisce null", async () => {
  const local = transientProduct(OBF);
  const { deps, writes } = fakeDeps(local);
  const r = await scan(OBF.gtin!, undefined, { NODE_ENV: "production" }, deps);
  assert.equal(r?.from, "db");
  assert.equal(r?.product, local);
  assert.equal(writes.length, 0);
  assert.equal(await scan("12345678", undefined, { NODE_ENV: "production" }, fakeDeps().deps), null);
});

test("prodotto non salvato: stessi campi e stesso voto di quello salvato", () => {
  const t = transientProduct(OBF, new Date("2026-11-03T12:00:00Z"));
  assert.equal(t.gtin, "3606000537675");
  assert.equal(t.origin, "obf");
  assert.equal(t.imageUrl, OBF.imageUrl);
  assert.equal(t.updatedAt, "2026-11-03T12:00:00.000Z");
  assert.ok(t.coverage !== null && t.coverage > 0);
});
