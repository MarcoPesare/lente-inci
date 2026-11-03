import { test } from "node:test";
import assert from "node:assert/strict";
import { checkAppSecret, MIN_SECRET_LENGTH, secretStartupMessage } from "../src/lib/secret";
import { AuthConfigError, sessionToken } from "../src/lib/auth";
import { register } from "../src/instrumentation";

const GOOD = "x".repeat(MIN_SECRET_LENGTH);

/** Esegue fn con alcune variabili d'ambiente impostate (undefined = rimossa), poi le ripristina. */
async function withEnv(vars: Record<string, string | undefined>, fn: () => unknown) {
  const env = process.env as Record<string, string | undefined>;
  const old = Object.fromEntries(Object.keys(vars).map((k) => [k, env[k]]));
  for (const [k, v] of Object.entries(vars)) if (v === undefined) delete env[k]; else env[k] = v;
  try { return await fn(); } finally { for (const [k, v] of Object.entries(old)) if (v === undefined) delete env[k]; else env[k] = v; }
}

test("APP_SECRET: mancante, vuoto o troppo corto non è valido", () => {
  assert.equal(checkAppSecret(undefined).ok, false);
  assert.equal(checkAppSecret("   ").ok, false);
  assert.equal(checkAppSecret("lente-inci").ok, false);
  assert.equal(checkAppSecret("x".repeat(MIN_SECRET_LENGTH - 1)).ok, false);
  assert.deepEqual(checkAppSecret(GOOD), { ok: true, secret: GOOD });
  assert.equal(secretStartupMessage(GOOD), null);
  assert.match(secretStartupMessage(undefined)!, /non è impostato/);
});

test("APP_SECRET: in produzione l'avvio si interrompe, in sviluppo solo un avviso", async () => {
  await withEnv({ NODE_ENV: "production", APP_SECRET: undefined, NEXT_PHASE: undefined }, () =>
    assert.rejects(() => register(), /Avvio interrotto/));
  await withEnv({ NODE_ENV: "production", APP_SECRET: "corto", NEXT_PHASE: undefined }, () =>
    assert.rejects(() => register(), /troppo corto/));
  await withEnv({ NODE_ENV: "production", APP_SECRET: GOOD, NEXT_PHASE: undefined }, () => assert.doesNotReject(() => register()));
  const warn = console.warn; let warned = "";
  console.warn = (m: string) => { warned = m; };
  try {
    await withEnv({ NODE_ENV: "development", APP_SECRET: undefined, NEXT_PHASE: undefined }, () => assert.doesNotReject(() => register()));
  } finally { console.warn = warn; }
  assert.match(warned, /ATTENZIONE: APP_SECRET non è impostato/);
});

test("APP_SECRET: nessun valore predefinito, con la password impostata senza segreto non c'è sessione", async () => {
  await withEnv({ APP_PASSWORD: "pw", APP_SECRET: undefined }, () => assert.rejects(() => sessionToken(), AuthConfigError));
  await withEnv({ APP_PASSWORD: undefined, APP_SECRET: undefined }, async () => assert.equal(await sessionToken(), null));
});
