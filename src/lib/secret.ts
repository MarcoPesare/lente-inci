/**
 * APP_SECRET firma i cookie di sessione. Non ha un valore predefinito: in produzione l'app non parte
 * se manca o è troppo corto (vedi src/instrumentation.ts), in sviluppo mostra un avviso.
 * Funziona sia nel runtime Node.js sia nel middleware (Edge): niente moduli di Node qui.
 */
export const MIN_SECRET_LENGTH = 32;

export type SecretCheck = { ok: true; secret: string } | { ok: false; problem: string };

export function checkAppSecret(value: string | undefined): SecretCheck {
  const v = value?.trim() ?? "";
  if (!v) return { ok: false, problem: "APP_SECRET non è impostato" };
  if (v.length < MIN_SECRET_LENGTH) return { ok: false, problem: `APP_SECRET è troppo corto (${v.length} caratteri, ne servono almeno ${MIN_SECRET_LENGTH})` };
  return { ok: true, secret: v };
}

export const SECRET_HELP = `Genera una stringa casuale, per esempio con "openssl rand -base64 48", e impostala come APP_SECRET.`;

/** Messaggio di avvio: null se APP_SECRET è valido. */
export function secretStartupMessage(value: string | undefined): string | null {
  const r = checkAppSecret(value);
  return r.ok ? null : `${r.problem}. ${SECRET_HELP}`;
}
