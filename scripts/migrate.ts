import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { sql } from "../src/lib/db";

// Applica in ordine i file SQL della cartella sql/ (sono scritti per poter essere rieseguiti).
const dir = join(process.cwd(), "sql");
for (const f of readdirSync(dir).filter((x) => x.endsWith(".sql")).sort()) {
  await sql.unsafe(readFileSync(join(dir, f), "utf8"));
  console.log("applicato", f);
}
await sql.end();
