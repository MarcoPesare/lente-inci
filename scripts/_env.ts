// Carica il file .env (se c'è) prima di collegarsi al database.
try {
  process.loadEnvFile(".env");
} catch {
  // nessun .env: si usano le variabili già impostate
}
if (!process.env.DATABASE_URL) {
  console.error("Manca DATABASE_URL: crea il file .env (vedi .env.example) oppure impostala nel terminale.");
  process.exit(1);
}
console.log("Database:", process.env.DATABASE_URL.replace(/\/\/[^@]*@/, "//***@").split("?")[0]);
