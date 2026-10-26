import { test } from "node:test";
import assert from "node:assert/strict";
import { analyze, lookup, parse } from "../src/lib/inci/engine";

test("riconosce gli ingredienti anche con errori di battitura", () => {
  assert.equal(lookup("Linaloon")?.e.name, "Linalool");
  assert.equal(lookup("Hexil Cinnamal")?.e.name, "Hexyl Cinnamal");
  assert.equal(lookup("helianthus annuus (sunflower) seed oil")?.e.name, "Helianthus Annuus Seed Oil");
});

test("divide qualunque separatore e unisce i nomi spezzati", () => {
  assert.deepEqual(parse("Aqua | Glycerin; Guar Hydroxypropyltrimonium| Chloride"), ["Aqua", "Glycerin", "Guar Hydroxypropyltrimonium Chloride"]);
  assert.deepEqual(parse("Aqua, 1,2-Hexanediol."), ["Aqua", "1,2-Hexanediol"]);
});

test("voto dello shampoo Balea alla menta", () => {
  const a = analyze("Aqua, Sodium Laureth Sulfate, Cocamidopropyl Betaine, Panthenol, Niacinamide, Parfum, Camphor, Glycerin, Glycol Distearate, Hydroxypropyl Guar Hydroxypropyltrimonium Chloride, Laureth-4, Piroctone Olamine, Sodium Benzoate, Potassium Sorbate, Linalool, Geraniol, Carvone, Sodium Chloride, Citric Acid, Sodium Hydroxide, Lactic Acid", "rinse");
  assert.equal(a.coverage, 1);
  assert.ok(a.score! > 14 && a.score! < 17, `voto ${a.score}`);
});

test("i conservanti che rilasciano formaldeide abbassano il voto", () => {
  const base = analyze("Aqua, Glycerin, Coco-Glucoside", "rinse").score!;
  const bad = analyze("Aqua, Glycerin, Coco-Glucoside, DMDM Hydantoin", "rinse").score!;
  assert.ok(bad < base - 1.5);
});

test("le famiglie valutano gli ingredienti non presenti nel dizionario", () => {
  const m = lookup("Bis-PEG-18 Methyl Ether Dimethyl Silane");
  assert.ok(m?.e.family);
});
