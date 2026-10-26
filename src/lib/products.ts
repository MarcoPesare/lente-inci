import { sql } from "./db";
import { summarize, type Flag, type Mode } from "./inci/engine";

export interface Product {
  id: string;
  gtin: string | null;
  name: string;
  brand: string;
  category: string;
  mode: Mode;
  inci: string | null;
  source: string;
  origin: "user" | "obf";
  imageUrl: string | null;
  hasPhoto: boolean;
  score: number | null;
  flags: Flag[];
  coverage: number | null;
  isItaly: boolean;
  updatedAt: string;
}

const COLS = sql`p.id, p.gtin, p.name, p.brand, p.category, p.mode, p.inci, p.source, p.origin,
  p.image_url, p.score, p.flags, p.coverage, p.is_italy, p.updated_at,
  (ph.product_id IS NOT NULL) AS has_photo`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function row(r: any): Product {
  return {
    id: r.id, gtin: r.gtin, name: r.name, brand: r.brand, category: r.category, mode: r.mode,
    inci: r.inci, source: r.source, origin: r.origin, imageUrl: r.image_url, hasPhoto: !!r.has_photo,
    score: r.score === null ? null : Number(r.score), flags: r.flags ?? [], coverage: r.coverage,
    isItaly: r.is_italy, updatedAt: new Date(r.updated_at).toISOString(),
  };
}

export function cleanCode(code: string) {
  return String(code).replace(/\D/g, "");
}
function codeVariants(code: string) {
  const c = cleanCode(code);
  return [...new Set([c, c.replace(/^0+/, ""), "0" + c, c.padStart(13, "0")].filter(Boolean))];
}

export async function getProduct(id: string): Promise<Product | null> {
  const r = await sql`SELECT ${COLS} FROM products p LEFT JOIN photos ph ON ph.product_id = p.id
    WHERE p.id = ${id} OR p.gtin = ${id} LIMIT 1`;
  return r[0] ? row(r[0]) : null;
}

export async function getByCode(code: string): Promise<Product | null> {
  const vars = codeVariants(code);
  if (!vars.length) return null;
  const r = await sql`SELECT ${COLS} FROM products p LEFT JOIN photos ph ON ph.product_id = p.id
    WHERE p.gtin IN ${sql(vars)} ORDER BY (p.origin = 'user') DESC LIMIT 1`;
  return r[0] ? row(r[0]) : null;
}

export async function getMany(ids: string[]): Promise<Product[]> {
  if (!ids.length) return [];
  const r = await sql`SELECT ${COLS} FROM products p LEFT JOIN photos ph ON ph.product_id = p.id WHERE p.id IN ${sql(ids)}`;
  const m = new Map(r.map((x) => [x.id as string, row(x)]));
  return ids.map((id) => m.get(id)).filter((p): p is Product => !!p);
}

export interface SearchOpts { q?: string; category?: string; sort?: "score" | "name"; limit?: number; offset?: number; avoidFlags?: Flag[]; onlyWithInci?: boolean }
export async function search(o: SearchOpts): Promise<{ items: Product[]; total: number }> {
  const words = (o.q ?? "").toLowerCase().split(/\s+/).map((w) => w.trim()).filter((w) => w.length > 0).slice(0, 6);
  const digits = cleanCode(o.q ?? "");
  const limit = Math.min(Math.max(o.limit ?? 30, 1), 100);
  const offset = Math.max(o.offset ?? 0, 0);
  const conds = [sql`TRUE`];
  if (words.length) {
    const textCond = words.map((w) => sql`p.search LIKE ${"%" + w.replace(/[%_\\]/g, "\\$&") + "%"}`).reduce((a, b) => sql`${a} AND ${b}`);
    conds.push(digits.length >= 8 ? sql`(${textCond} OR p.gtin = ${digits})` : sql`(${textCond})`);
  }
  if (o.category) conds.push(sql`p.category = ${o.category}`);
  if (o.onlyWithInci) conds.push(sql`p.inci IS NOT NULL`);
  if (o.avoidFlags?.length) conds.push(sql`NOT (p.flags && ${o.avoidFlags}::text[])`);
  const where = conds.reduce((a, b) => sql`${a} AND ${b}`);
  const order = o.sort === "name" ? sql`p.name ASC` : sql`(p.coverage >= 70) DESC NULLS LAST, p.score DESC NULLS LAST, p.is_italy DESC, p.name ASC`;
  const [items, count] = await Promise.all([
    sql`SELECT ${COLS} FROM products p LEFT JOIN photos ph ON ph.product_id = p.id WHERE ${where} ORDER BY ${order} LIMIT ${limit} OFFSET ${offset}`,
    sql`SELECT count(*)::int AS n FROM products p WHERE ${where}`,
  ]);
  return { items: items.map(row), total: count[0].n };
}

export async function alternatives(p: Product, avoidFlags: Flag[] = [], n = 3): Promise<Product[]> {
  if (p.score === null) return [];
  const r = await sql`SELECT ${COLS} FROM products p LEFT JOIN photos ph ON ph.product_id = p.id
    WHERE p.category = ${p.category} AND p.id <> ${p.id} AND p.score > ${p.score}
      AND p.coverage >= 70
      ${avoidFlags.length ? sql`AND NOT (p.flags && ${avoidFlags}::text[])` : sql``}
    ORDER BY p.score DESC, p.is_italy DESC LIMIT ${n}`;
  return r.map(row);
}

export interface ProductInput {
  id?: string; gtin?: string | null; name: string; brand?: string; category?: string; mode?: Mode;
  inci?: string | null; source?: string; origin?: "user" | "obf"; imageUrl?: string | null; isItaly?: boolean;
}
export function slugId(name: string, brand = "") {
  const base = (brand + "-" + name).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);
  return base + "-" + Math.random().toString(36).slice(2, 6);
}

/** Crea o aggiorna un prodotto, ricalcolando voto e segnalazioni. */
export async function upsert(input: ProductInput): Promise<Product> {
  const gtin = input.gtin ? cleanCode(input.gtin) || null : null;
  const id = input.id || gtin || slugId(input.name, input.brand);
  const mode: Mode = input.mode === "leave" ? "leave" : "rinse";
  const s = summarize(input.inci ?? null, mode);
  await sql`INSERT INTO products (id, gtin, name, brand, category, mode, inci, source, origin, image_url, score, flags, coverage, is_italy, updated_at)
    VALUES (${id}, ${gtin}, ${input.name}, ${input.brand ?? ""}, ${input.category ?? "Altro"}, ${mode}, ${input.inci?.trim() || null},
      ${input.source ?? ""}, ${input.origin ?? "user"}, ${input.imageUrl ?? null}, ${s.score}, ${s.flags}, ${s.coverage}, ${input.isItaly ?? false}, now())
    ON CONFLICT (id) DO UPDATE SET gtin = EXCLUDED.gtin, name = EXCLUDED.name, brand = EXCLUDED.brand, category = EXCLUDED.category,
      mode = EXCLUDED.mode, inci = EXCLUDED.inci, source = EXCLUDED.source, origin = EXCLUDED.origin,
      image_url = COALESCE(EXCLUDED.image_url, products.image_url), score = EXCLUDED.score, flags = EXCLUDED.flags,
      coverage = EXCLUDED.coverage, is_italy = EXCLUDED.is_italy OR products.is_italy, updated_at = now()`;
  return (await getProduct(id))!;
}

export async function remove(id: string) {
  await sql`DELETE FROM products WHERE id = ${id}`;
}
