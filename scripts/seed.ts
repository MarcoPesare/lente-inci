import "./_env";
import { readFileSync } from "node:fs";
import { sql } from "../src/lib/db";
import { upsert, type ProductInput } from "../src/lib/products";

// Prodotti verificati a mano (schede dm), utili come punto di partenza.
const items: ProductInput[] = JSON.parse(readFileSync("data/seed-products.json", "utf8"));
for (const p of items) await upsert({ ...p, origin: "user" });
console.log(`inseriti ${items.length} prodotti`);
await sql.end();
