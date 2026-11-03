import { checkAppSecret } from "./secret";

/** Protezione semplice della beta: una password condivisa, cookie firmato. */
export const COOKIE = "li_session";

/** Errore di configurazione: APP_PASSWORD è impostata ma APP_SECRET manca o non è valido. */
export class AuthConfigError extends Error {}

export async function sessionToken(): Promise<string | null> {
  const pw = process.env.APP_PASSWORD;
  if (!pw) return null;
  const s = checkAppSecret(process.env.APP_SECRET);
  if (!s.ok) throw new AuthConfigError(s.problem);
  const data = new TextEncoder().encode(pw + "|" + s.secret);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
