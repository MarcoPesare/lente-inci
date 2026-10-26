import type { Mode } from "./inci/engine";

export const CATEGORIES = ["Shampoo", "Balsamo", "Styling", "Trattamento", "Corpo", "Viso", "Igiene orale", "Altro"] as const;
export type Category = (typeof CATEGORIES)[number];

const RULES: [Category, string[]][] = [
  ["Igiene orale", ["toothpaste", "dentifric", "mouthwash", "oral", "dental", "bain-de-bouche", "zahnpasta", "collutor"]],
  ["Shampoo", ["shampoo", "shampoing", "champu", "champú"]],
  ["Balsamo", ["conditioner", "apres-shampo", "après-shampo", "balsamo", "spülung", "spulung"]],
  ["Styling", ["hair-styl", "hair-gel", "styling", "gel-coiffant", "hairspray", "hair-spray", "laque", "mousse-coiffante", "wax", "cire-coiff"]],
  ["Trattamento", ["hair-mask", "hair-oil", "masque-capillaire", "hair-care", "soin-capillaire", "serum", "leave-in"]],
  ["Corpo", ["shower", "douche", "body", "corps", "soap", "savon", "deodorant", "déodorant", "bath", "hand-cream", "sun", "solaire", "lotion"]],
  ["Viso", ["face", "visage", "facial", "make-up", "makeup", "maquillage", "lip", "levre", "lèvre", "eye", "yeux", "cleanser", "demaquill", "démaquill", "moisturi", "cream", "creme", "crème"]],
];
const RINSE = ["shampoo", "shampoing", "conditioner", "apres-shampo", "après-shampo", "shower", "douche", "soap", "savon", "toothpaste", "dentifric", "mouthwash", "bain-de-bouche", "cleanser", "nettoyant", "demaquill", "démaquill", "bath", "spülung", "duschgel", "zahnpasta", "gel-lavant", "wash", "collutor"];

/** Deduce categoria e tipo d'uso dalle categorie di Open Beauty Facts e dal nome. */
export function categorize(tags: string, name: string): { category: Category; mode: Mode } {
  const s = (tags + " " + name).toLowerCase();
  const category = RULES.find(([, ks]) => ks.some((k) => s.includes(k)))?.[0] ?? "Altro";
  const mode: Mode = RINSE.some((k) => s.includes(k)) ? "rinse" : "leave";
  return { category, mode };
}
