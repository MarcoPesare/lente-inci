import { secretStartupMessage } from "./lib/secret";

/** Eseguito una volta all'avvio del server: controlla la configurazione di sicurezza. */
export async function register() {
  if (process.env.NEXT_PHASE === "phase-production-build") return; // la build non usa APP_SECRET
  const problem = secretStartupMessage(process.env.APP_SECRET);
  if (!problem) return;
  if (process.env.NODE_ENV === "production") {
    console.error(`\n[lente-inci] Avvio interrotto: ${problem}\n`);
    // Next registra l'errore ma lascerebbe il server acceso (con risposte 500): nel runtime Node.js usciamo davvero.
    if (process.env.NEXT_RUNTIME === "nodejs") (await import("./lib/exit-node")).exitProcess(1);
    throw new Error(`Avvio interrotto: ${problem}`);
  }
  console.warn(`\n[lente-inci] ATTENZIONE: ${problem} Senza APP_SECRET l'accesso con password non funziona.\n`);
}
