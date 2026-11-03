import { test } from "node:test";
import assert from "node:assert/strict";
import { authEnabled, AuthConfigError, checkWriteAccess, createSession, SESSION_TTL_SECONDS, verifySession } from "../src/lib/auth";
import { passwordMatches } from "../src/lib/password";

const ENV = { APP_PASSWORD: "password-della-beta", APP_SECRET: "s".repeat(48) };
const NOW = Date.UTC(2026, 10, 3, 12, 0, 0);

test("password: confronto corretto, anche con lunghezze diverse o valori non stringa", () => {
  assert.equal(passwordMatches("password-della-beta", ENV.APP_PASSWORD), true);
  assert.equal(passwordMatches("password-della-bet", ENV.APP_PASSWORD), false);
  assert.equal(passwordMatches("password-della-beta-e-altro", ENV.APP_PASSWORD), false);
  assert.equal(passwordMatches("", ENV.APP_PASSWORD), false);
  assert.equal(passwordMatches(null, ENV.APP_PASSWORD), false);
  assert.equal(passwordMatches("qualunque", undefined), false);
});

test("sessione: valida subito, scade dopo 7 giorni", async () => {
  const t = await createSession(ENV, NOW);
  assert.ok(t);
  assert.equal(SESSION_TTL_SECONDS, 7 * 24 * 3600);
  assert.equal(await verifySession(t, ENV, NOW), true);
  assert.equal(await verifySession(t, ENV, NOW + (SESSION_TTL_SECONDS - 60) * 1000), true);
  assert.equal(await verifySession(t, ENV, NOW + (SESSION_TTL_SECONDS + 1) * 1000), false);
});

test("sessione: ogni token è diverso e non è ricavato solo dalla password", async () => {
  const a = await createSession(ENV, NOW), b = await createSession(ENV, NOW);
  assert.notEqual(a, b);
  assert.ok(!a!.includes(ENV.APP_PASSWORD));
});

test("sessione: rifiutata se manomessa, con un altro segreto o dopo il cambio di password", async () => {
  const t = (await createSession(ENV, NOW))!;
  const [body, sig] = t.split(".");
  // payload modificato (scadenza allungata) con la vecchia firma
  const p = JSON.parse(Buffer.from(body, "base64url").toString());
  const forged = Buffer.from(JSON.stringify({ ...p, exp: p.exp + 3600 * 24 * 365 })).toString("base64url");
  assert.equal(await verifySession(`${forged}.${sig}`, ENV, NOW), false);
  assert.equal(await verifySession(`${body}.${sig.slice(0, -2)}xx`, ENV, NOW), false);
  assert.equal(await verifySession(t, { ...ENV, APP_SECRET: "t".repeat(48) }, NOW), false);
  assert.equal(await verifySession(t, { ...ENV, APP_PASSWORD: "nuova-password" }, NOW), false);
  for (const bad of [undefined, "", "abc", "a.b.c", "!!!.???"]) assert.equal(await verifySession(bad, ENV, NOW), false);
});

test("sessione: emessa nel futuro non è valida", async () => {
  const t = await createSession(ENV, NOW + 3600 * 1000);
  assert.equal(await verifySession(t, ENV, NOW), false);
});

test("protezione disattivata senza password, errore di configurazione senza segreto", async () => {
  assert.equal(authEnabled({}), false);
  assert.equal(await createSession({}, NOW), null);
  assert.equal(await verifySession("x.y", {}, NOW), false);
  assert.equal(authEnabled(ENV), true);
  assert.throws(() => authEnabled({ APP_PASSWORD: "pw" }), AuthConfigError);
  await assert.rejects(() => createSession({ APP_PASSWORD: "pw", APP_SECRET: "corto" }, NOW), AuthConfigError);
});

test("scritture del catalogo: servono una sessione valida, o lo sviluppo locale senza password", async () => {
  const t = (await createSession(ENV))!;
  assert.deepEqual(await checkWriteAccess(t, ENV), { ok: true });
  const noCookie = await checkWriteAccess(undefined, ENV);
  assert.equal(!noCookie.ok && noCookie.status, 401);
  const forged = await checkWriteAccess(t.slice(0, -3) + "abc", ENV);
  assert.equal(!forged.ok && forged.status, 401);
  const prodOpen = await checkWriteAccess(undefined, { NODE_ENV: "production" });
  assert.equal(!prodOpen.ok && prodOpen.status, 403);
  assert.deepEqual(await checkWriteAccess(undefined, { NODE_ENV: "development" }), { ok: true });
  const noSecret = await checkWriteAccess(t, { APP_PASSWORD: "pw", NODE_ENV: "production" });
  assert.equal(!noSecret.ok && noSecret.status, 503);
});
