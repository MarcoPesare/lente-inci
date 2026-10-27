/**
 * Importa il catalogo di Open Beauty Facts (licenza ODbL).
 *
 *   npm run import:obf                      scarica l'export aggiornato e lo importa
 *   npm run import:obf -- --file data/x.csv usa un file già scaricato (.csv o .csv.gz)
 *   npm run import:obf -- --only-inci       importa solo i prodotti con la lista ingredienti
 *
 * I prodotti corretti a mano (origin = 'user') non vengono mai sovrascritti.
 */
import "./_env";
import { createReadStream } from "node:fs";
import { Readable } from "node:stream";
import { createGunzip } from "node:zlib";
import { parse } from "csv-parse";
import { sql } from "../src/lib/db";
import { categorize } from "../src/lib/categorize";
import { summarize } from "../src/lib/inci/engine";

const URL_CSV = "https://static.openbeautyfacts.org/data/en.openbeautyfacts.org.products.csv.gz";
const args = process.argv.slice(2);
const file = args.includes("--file") ? args[args.indexOf("--file") + 1] : null;
const onlyInci = args.includes("--only-inci");

async function source(): Promise<NodeJS.ReadableStream> {
  if (file) {
    const s = createReadStream(file);
    return file.endsWith(".gz") ? s.pipe(createGunzip()) : s;
  }
  console.log("Scarico", URL_CSV);
  const r = await fetch(URL_CSV, { headers: { "User-Agent": process.env.OBF_USER_AGENT ?? "LenteINCI/0.1 (beta)" } });
  if (!r.ok || !r.body) throw new Error(`Download non riuscito: HTTP ${r.status}`);
  return Readable.fromWeb(r.body as import("node:stream/web").ReadableStream).pipe(createGunzip());
}

const clean = (s: unknown) => String(s ?? "").replace(/�/g, "").replace(/\s+/g, " ").trim();
type Row = Record<string, string>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const batch: any[][] = [];
let seen = 0, kept = 0;
const codes = new Set<string>();

async function flush() {
  if (!batch.length) return;
  const rows = batch.splice(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await sql`INSERT INTO products ${sql(rows.map((r): any => ({
    id: r[0], gtin: r[0], name: r[1], brand: r[2], category: r[3], mode: r[4], inci: r[5], source: "Open Beauty Facts",
    origin: "obf", image_url: r[6], score: r[7], flags: r[8], coverage: r[9], is_italy: r[10],
  })))}
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, brand = EXCLUDED.brand, category = EXCLUDED.category, mode = EXCLUDED.mode,
    inci = EXCLUDED.inci, image_url = EXCLUDED.image_url, score = EXCLUDED.score, flags = EXCLUDED.flags,
    coverage = EXCLUDED.coverage, is_italy = EXCLUDED.is_italy, updated_at = now()
  WHERE products.origin = 'obf'`;
}

const parser = (await source()).pipe(parse({ delimiter: "\t", columns: true, relax_quotes: true, relax_column_count: true, quote: false }));
for await (const r of parser as AsyncIterable<Row>) {
  seen++;
  const code = clean(r.code);
  if (!/^\d{8,14}$/.test(code) || codes.has(code)) continue;
  const inci = clean(r.ingredients_text).slice(0, 8000) || null;
  if (onlyInci && (!inci || inci.length < 15)) continue;
  const name = clean(r.product_name || r.generic_name).slice(0, 160);
  const brand = clean(String(r.brands ?? "").split(",")[0]).slice(0, 80);
  if (!name && !brand) continue;
  codes.add(code);
  const { category, mode } = categorize(`${r.categories_tags ?? ""} ${r.categories_en ?? ""}`, name);
  const s = summarize(inci && inci.length >= 15 ? inci : null, mode);
  batch.push([code, name || `${brand} (senza nome)`, brand, category, mode, inci, clean(r.image_small_url) || null,
    s.score, s.flags, s.coverage, String(r.countries_tags ?? "").includes("en:italy")]);
  kept++;
  if (batch.length >= 500) { await flush(); process.stdout.write(`\r${seen} letti, ${kept} importati`); }
}
await flush();
console.log(`\nFatto: ${seen} righe lette, ${kept} prodotti importati.`);
await sql.end();
