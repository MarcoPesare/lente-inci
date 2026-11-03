import postgres from "postgres";

declare global {
  var __sql: ReturnType<typeof postgres> | undefined;
}

/** Connessione unica riutilizzata tra le richieste (anche in sviluppo con hot reload). */
export const sql =
  globalThis.__sql ??
  postgres(process.env.DATABASE_URL ?? "postgres://lente:lente@localhost:5432/lente", {
    max: Number(process.env.DB_POOL_MAX ?? 5),
    idle_timeout: 20,
    prepare: false, // compatibile con i pooler (Neon, Supabase)
  });
if (process.env.NODE_ENV !== "production") globalThis.__sql = sql;
