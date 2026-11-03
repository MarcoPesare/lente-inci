import { checkAppSecret } from "./secret";

/**
 * Protezione della beta: una password condivisa (APP_PASSWORD) e un cookie di sessione firmato.
 *
 * Il token è "<payload>.<firma>": il payload contiene scadenza e un valore casuale, la firma è un HMAC-SHA256
 * con APP_SECRET. Nella firma entra anche un'impronta della password, così cambiarla invalida tutte le sessioni.
 * Usa solo Web Crypto: funziona sia nel middleware (Edge) sia nelle route (Node.js).
 */
export const COOKIE = "li_session";
export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

/** Errore di configurazione: APP_PASSWORD è impostata ma APP_SECRET manca o non è valido. */
export class AuthConfigError extends Error {}

type AuthEnv = { APP_PASSWORD?: string; APP_SECRET?: string; [name: string]: string | undefined };
type Payload = { v: 1; iat: number; exp: number; n: string };

const enc = new TextEncoder();

function b64url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function fromB64url(s: string): Uint8Array<ArrayBuffer> {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** Password e segreto validi, oppure null se la protezione è disattivata (APP_PASSWORD vuota). */
function config(env: AuthEnv): { password: string; secret: string } | null {
  const password = env.APP_PASSWORD;
  if (!password) return null;
  const s = checkAppSecret(env.APP_SECRET);
  if (!s.ok) throw new AuthConfigError(s.problem);
  return { password, secret: s.secret };
}

async function hmacKey(secret: string) {
  return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}
async function passwordTag(password: string) {
  return b64url(new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(`lente-inci|password|${password}`))));
}

/** La protezione con password è attiva? (lancia AuthConfigError se manca APP_SECRET) */
export function authEnabled(env: AuthEnv = process.env): boolean {
  return config(env) !== null;
}

/** Crea un token di sessione valido SESSION_TTL_SECONDS; null se la protezione è disattivata. */
export async function createSession(env: AuthEnv = process.env, now = Date.now()): Promise<string | null> {
  const c = config(env);
  if (!c) return null;
  const iat = Math.floor(now / 1000);
  const payload: Payload = { v: 1, iat, exp: iat + SESSION_TTL_SECONDS, n: b64url(crypto.getRandomValues(new Uint8Array(16))) };
  const body = b64url(enc.encode(JSON.stringify(payload)));
  const sig = await crypto.subtle.sign("HMAC", await hmacKey(c.secret), enc.encode(`${body}.${await passwordTag(c.password)}`));
  return `${body}.${b64url(new Uint8Array(sig))}`;
}

/** Verifica firma e scadenza del token (confronto della firma a tempo costante, tramite crypto.subtle.verify). */
export async function verifySession(token: string | undefined | null, env: AuthEnv = process.env, now = Date.now()): Promise<boolean> {
  const c = config(env);
  if (!c || !token) return false;
  const parts = token.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return false;
  const [body, sig] = parts;
  try {
    const ok = await crypto.subtle.verify("HMAC", await hmacKey(c.secret), fromB64url(sig), enc.encode(`${body}.${await passwordTag(c.password)}`));
    if (!ok) return false;
    const p = JSON.parse(new TextDecoder().decode(fromB64url(body))) as Partial<Payload>;
    const t = Math.floor(now / 1000);
    return p.v === 1 && typeof p.exp === "number" && typeof p.iat === "number" && p.exp > t && p.iat <= t + 60;
  } catch {
    return false;
  }
}

export type WriteCheck = { ok: true } | { ok: false; status: 401 | 403 | 503; error: string };

/**
 * Chi può creare, modificare o cancellare prodotti e foto:
 * - con APP_PASSWORD impostata, solo chi ha una sessione valida;
 * - senza APP_PASSWORD, in produzione nessuno (non può esistere una sessione); in sviluppo tutti.
 */
export async function checkWriteAccess(cookie: string | undefined, env: AuthEnv = process.env): Promise<WriteCheck> {
  try {
    if (authEnabled(env)) {
      return (await verifySession(cookie, env)) ? { ok: true } : { ok: false, status: 401, error: "Accesso richiesto: entra con la password per modificare il catalogo." };
    }
  } catch (e) {
    if (!(e instanceof AuthConfigError)) throw e;
    return { ok: false, status: 503, error: "Configurazione incompleta: APP_SECRET non valido." };
  }
  if (env.NODE_ENV === "production") {
    return { ok: false, status: 403, error: "Modifiche al catalogo disattivate: sul server non è impostata APP_PASSWORD." };
  }
  return { ok: true };
}
