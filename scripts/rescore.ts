import { sql } from "../src/lib/db";
import { summarize, type Mode } from "../src/lib/inci/engine";

// Ricalcola voti e segnalazioni dopo una modifica al dizionario o al motore.
let n = 0, last = "";
for (;;) {
  const rows = await sql`SELECT id, inci, mode FROM products WHERE id > ${last} ORDER BY id LIMIT 2000`;
  if (!rows.length) break;
  for (const r of rows) {
    const s = summarize(r.inci, r.mode as Mode);
    await sql`UPDATE products SET score = ${s.score}, flags = ${s.flags}, coverage = ${s.coverage} WHERE id = ${r.id}`;
    n++; last = r.id;
  }
  process.stdout.write(`\r${n} prodotti ricalcolati`);
}
console.log();
await sql.end();
