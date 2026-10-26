/** Protezione semplice della beta: una password condivisa, cookie firmato. */
export const COOKIE = "li_session";

export async function sessionToken(): Promise<string | null> {
  const pw = process.env.APP_PASSWORD;
  if (!pw) return null;
  const data = new TextEncoder().encode(pw + "|" + (process.env.APP_SECRET ?? "lente-inci"));
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
