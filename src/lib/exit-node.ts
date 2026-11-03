/** Solo runtime Node.js: termina il processo del server (usato quando la configurazione non è sicura). */
export function exitProcess(code: number): never {
  process.exit(code);
}
