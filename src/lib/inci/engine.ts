/**
 * Motore di analisi INCI: riconosce gli ingredienti di una lista,
 * assegna un giudizio a ciascuno e calcola il voto del prodotto su 20.
 * Gira identico sul server (import, salvataggio) e nel browser (analisi live).
 */
import raw from "./ingredients.json";

export type Flag =
  | "FORM" | "BAN" | "SIL" | "SOL" | "ALL" | "PROF" | "ALC"
  | "PEG" | "MIN" | "POLY" | "IRR" | "ATT";

export type Mode = "rinse" | "leave";

export interface Ingredient {
  name: string;
  aliases: string[];
  r: number; // 0 da evitare … 4 ottimo
  flags: Flag[];
  fn: string;
  note: string;
  family?: boolean; // valutato per famiglia, non presente nel dizionario
}

export const FLAGS: Record<Flag, { label: string; tone: "bad" | "warn" | "mid" | "good"; avoid?: string }> = {
  FORM: { label: "Rilascia formaldeide", tone: "bad", avoid: "Conservanti che rilasciano formaldeide" },
  BAN: { label: "Vietato in UE", tone: "bad" },
  SIL: { label: "Silicone", tone: "warn", avoid: "Siliconi" },
  SOL: { label: "Solfato", tone: "warn", avoid: "Solfati (SLS, SLES e simili)" },
  ALL: { label: "Allergene UE", tone: "warn", avoid: "Allergeni da profumo dichiarati" },
  PROF: { label: "Profumo", tone: "mid", avoid: "Profumo e oli essenziali" },
  ALC: { label: "Alcol", tone: "warn", avoid: "Alcol etilico" },
  PEG: { label: "Etossilato", tone: "mid", avoid: "Ingredienti etossilati (PEG, -eth)" },
  MIN: { label: "Derivato del petrolio", tone: "mid", avoid: "Oli minerali e derivati del petrolio" },
  POLY: { label: "Polimero sintetico", tone: "mid", avoid: "Polimeri sintetici" },
  IRR: { label: "Può irritare", tone: "warn", avoid: "Ingredienti potenzialmente irritanti" },
  ATT: { label: "Attivo utile", tone: "good" },
};

export const RATINGS = ["Da evitare", "Discutibile", "Accettabile", "Buono", "Ottimo"] as const;

export const key = (s: string) =>
  String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");

export const DICTIONARY: Ingredient[] = (raw as Ingredient[]).slice().sort((a, b) => a.name.localeCompare(b.name));
const INDEX = new Map<string, Ingredient>();
for (const e of raw as Ingredient[]) {
  for (const a of [e.name, ...e.aliases]) {
    const k = key(a);
    if (k && !INDEX.has(k)) INDEX.set(k, e);
  }
}
const KEYS = [...INDEX.keys()];

/** Regole per famiglie: valutano gli ingredienti che non sono nel dizionario. */
const FAMILY: [RegExp, number, Flag[], string][] = [
  [/^ci ?\d{5}|^(blue|red|yellow|green|orange|violet) \d+/, 2, [], "Colorante"],
  [/(dimethicone|methicone|siloxane|silsesquioxane|siloxysilicate)/, 1, ["SIL"], "Silicone"],
  [/(^|[ -])(peg|ppg)-\d|(ceteth|ceteareth|steareth|laureth|trideceth|oleth|isoceteth|pareth|deceth|beheneth|buteth)-\d|^poloxamer|^polysorbate/, 2, ["PEG"], "Etossilato (emulsionante o solubilizzante)"],
  [/(copolymer|crosspolymer|polyacrylate|acrylates|polyethylene|nylon-|polyquaternium|polyurethane|polymethyl)/, 1, ["POLY"], "Polimero sintetico"],
  [/paraben$/, 2, [], "Conservante (parabene)"],
  [/(leaf|peel|flower|bark|herb|needle|wood|rind|twig) oil$|essential oil|^(mentha|citrus|lavandula|eucalyptus|melaleuca|cymbopogon|pogostemon|rosmarinus|salvia|thymus|cananga|cinnamomum|pelargonium).* oil$/, 2, ["PROF"], "Olio essenziale (profumo)"],
  [/(seed|kernel|nut|fruit|germ|bran|pulp) oil$| oil$/, 4, [], "Olio vegetale (emolliente)"],
  [/butter$/, 4, [], "Burro vegetale (emolliente)"],
  [/(extract|filtrate|juice|powder|leaf|flower|root)$/, 3, [], "Estratto vegetale"],
  [/ferment/, 3, [], "Fermento"],
  [/(flower|leaf|fruit) water$|hydrosol|distillate/, 3, [], "Acqua aromatica vegetale"],
  [/^hydrolyzed /, 3, [], "Proteina idrolizzata (condizionante)"],
  [/(gum|starch)$/, 4, [], "Addensante naturale"],
  [/glucoside$/, 4, [], "Tensioattivo o emulsionante delicato"],
  [/(isethionate|glutamate|sarcosinate|glycinate|taurate|lactylate)$/, 4, [], "Tensioattivo delicato"],
  [/(betaine|sultaine)$/, 3, [], "Tensioattivo delicato"],
  [/^ceramide/, 4, ["ATT"], "Rinforza la barriera"],
  [/peptide/, 4, ["ATT"], "Peptide (trattante)"],
  [/^polyglyceryl-/, 4, [], "Emulsionante"],
  [/^sodium .*ate$|^potassium .*ate$/, 3, [], "Sale (regolatore o sapone)"],
  [/ (cera|wax)$|^cera /, 3, [], "Cera"],
  [/(caprylate|caprate|laurate|myristate|palmitate|stearate|oleate|isostearate|ethylhexanoate|isononanoate|benzoate|succinate|adipate|sebacate|citrate)$/, 3, [], "Estere emolliente"],
];
const famCache = new Map<string, Ingredient>();
function family(rawName: string): Ingredient | null {
  const s = rawName.toLowerCase().replace(/\s+/g, " ").trim();
  if (s.length < 4) return null;
  for (const [re, r, flags, fn] of FAMILY) {
    if (re.test(s)) {
      const k = fn + "|" + s;
      if (!famCache.has(k)) {
        famCache.set(k, {
          name: rawName.replace(/\b([a-z])/g, (c) => c.toUpperCase()),
          aliases: [], r, flags, fn,
          note: "Valutato in base alla famiglia di ingredienti: non è nel dizionario.",
          family: true,
        });
      }
      return famCache.get(k)!;
    }
  }
  return null;
}

function lev(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  let p = Array.from({ length: n + 1 }, (_, i) => i), c = new Array<number>(n + 1);
  for (let i = 1; i <= m; i++) {
    c[0] = i;
    for (let j = 1; j <= n; j++) c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    [p, c] = [c, p];
  }
  return p[n];
}

export interface Match { e: Ingredient; fuzzy: boolean }
const lkCache = new Map<string, Match | null>();
export function lookup(rawName: string): Match | null {
  const k = key(rawName);
  if (!k) return null;
  if (lkCache.has(k)) return lkCache.get(k)!;
  let res: Match | null = null;
  if (INDEX.has(k)) res = { e: INDEX.get(k)!, fuzzy: false };
  if (!res) {
    const nk = key(rawName.replace(/\([^)]*\)/g, " "));
    if (nk && INDEX.has(nk)) res = { e: INDEX.get(nk)!, fuzzy: false };
  }
  if (!res) {
    const parts = rawName.split(/[\/()]/).map((s) => s.trim()).filter(Boolean);
    if (parts.length > 1) for (const p of parts) { const pk = key(p); if (INDEX.has(pk)) { res = { e: INDEX.get(pk)!, fuzzy: false }; break; } }
  }
  if (!res && k.length >= 5 && k.length <= 48) {
    let best = "", bd = 1e9;
    for (const kk of KEYS) {
      if (Math.abs(kk.length - k.length) > 3) continue;
      const d = lev(k, kk);
      if (d < bd) { bd = d; best = kk; if (d === 0) break; }
    }
    if (best && bd <= Math.max(1, Math.floor(k.length * 0.12))) res = { e: INDEX.get(best)!, fuzzy: true };
  }
  if (!res) { const f = family(rawName.replace(/\([^)]*\)/g, " ")); if (f) res = { e: f, fuzzy: false }; }
  if (lkCache.size > 50000) lkCache.clear();
  lkCache.set(k, res);
  return res;
}

/** Divide un testo INCI in nomi di ingredienti, qualunque sia il separatore. */
export function parse(text: string): string[] {
  let t = String(text || "")
    .replace(/&(gt|lt|amp|quot|#39|apos|nbsp);?/g, " ")
    .replace(/\[[^\]]*\]/g, ",")
    .replace(/(\d),(\d)/g, "$1§$2");
  t = t.replace(/^\s*(sostanze|ingredienti|ingredients|inci|bestandteile|inhaltsstoffe)\s*:?/gim, "");
  t = t.replace(/(ingredients|ingredienti|inhaltsstoffe)\s*:/gi, ",");
  const toks = t.split(/[,\n;|•·]+/)
    .map((s) => s.replace(/§/g, ",").replace(/\(f\.?i\.?l\.?[^)]*\)/gi, "").replace(/\(nano\)/gi, "")
      .replace(/[*¹²³⁴⁰°†]+/g, "").replace(/\.+\s*$/, "").replace(/\s+/g, " ").trim())
    .filter((s) => s && s.split(" ").length <= 7 && !/^(gli ingredienti|ingredients from|inhaltsstoffe aus|da agricoltura|from natural|ingredienti da)/i.test(s));
  const out: string[] = [];
  for (let i = 0; i < toks.length; i++) {
    const a = toks[i];
    if (i + 1 < toks.length && !INDEX.has(key(a)) && INDEX.has(key(a + " " + toks[i + 1]))) { out.push(a + " " + toks[i + 1]); i++; continue; }
    out.push(a);
  }
  return out;
}

export interface Row { pos: number; raw: string; m: Match | null; dup: boolean; eff?: number }
export interface Analysis {
  rows: Row[];
  score: number | null;
  coverage: number;
  counts: Partial<Record<Flag, number>>;
  total: number;
  dist: number[];
  names: Set<string>;
}

const RINSE_SOFTENED: Flag[] = ["ALL", "PROF", "SOL", "IRR"];

export function analyze(text: string, mode: Mode): Analysis {
  const rows: Row[] = [];
  const seen = new Set<string>();
  parse(text).forEach((n, i) => {
    const m = lookup(n);
    const dup = !!(m && seen.has(m.e.name));
    if (m) seen.add(m.e.name);
    rows.push({ pos: i + 1, raw: n, m, dup });
  });
  let sw = 0, ss = 0, known = 0, extra = 0;
  const counts: Partial<Record<Flag, number>> = {};
  const dist = [0, 0, 0, 0, 0];
  for (const r of rows) {
    if (!r.m || r.dup) continue;
    known++;
    const e = r.m.e;
    let rt = e.r;
    if (mode === "rinse" && e.flags.some((f) => RINSE_SOFTENED.includes(f))) rt = Math.min(4, rt + 1);
    r.eff = rt;
    dist[rt]++;
    const w = 1 / Math.sqrt(r.pos);
    sw += w; ss += w * rt;
    for (const f of e.flags) counts[f] = (counts[f] || 0) + 1;
    if (e.flags.includes("FORM") || e.flags.includes("BAN")) extra += 2;
    else if (e.r === 0) extra += 1;
  }
  const total = rows.filter((r) => !r.dup).length;
  let score: number | null = sw ? (ss / sw) / 4 * 20 - extra : null;
  if (score !== null) score = Math.max(0, Math.min(20, Math.round(score * 10) / 10));
  return {
    rows, score, coverage: total ? known / total : 0, counts, total, dist,
    names: new Set(rows.filter((r) => r.m).map((r) => r.m!.e.name)),
  };
}

/** Riassunto compatto da salvare nel database insieme al prodotto. */
export function summarize(inci: string | null | undefined, mode: Mode) {
  if (!inci || !inci.trim()) return { score: null, flags: [] as Flag[], coverage: null };
  const a = analyze(inci, mode);
  return { score: a.score, flags: Object.keys(a.counts) as Flag[], coverage: Math.round(a.coverage * 100) };
}

export interface Profile { favorites: string[]; history: string[]; avoidFlags: Flag[]; avoidIngr: string[] }
export const emptyProfile = (): Profile => ({ favorites: [], history: [], avoidFlags: [], avoidIngr: [] });

/** Ingredienti del prodotto che l'utente ha scelto di evitare. */
export function conflicts(a: Analysis, p: Profile) {
  const fl = new Set(p.avoidFlags), ig = new Set(p.avoidIngr);
  const out: { name: string; why: string[] }[] = [];
  for (const r of a.rows) {
    if (!r.m || r.dup) continue;
    const e = r.m.e, why: string[] = [];
    if (ig.has(e.name)) why.push("nella tua lista");
    for (const f of e.flags) if (fl.has(f)) why.push(FLAGS[f].label.toLowerCase());
    if (why.length) out.push({ name: e.name, why });
  }
  return out;
}

export function scoreTone(s: number | null | undefined): 0 | 1 | 2 | 3 | 4 | -1 {
  if (s === null || s === undefined) return -1;
  if (s >= 16) return 4; if (s >= 13) return 3; if (s >= 10) return 2; if (s >= 7) return 1; return 0;
}
export function verdict(s: number | null): string {
  if (s === null) return "Nessun ingrediente riconosciuto";
  if (s >= 16) return "Formula molto pulita"; if (s >= 13) return "Buona formula";
  if (s >= 10) return "Formula nella media"; if (s >= 7) return "Formula con diversi punti deboli";
  return "Formula da evitare";
}
