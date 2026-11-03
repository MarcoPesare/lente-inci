import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Confronta la password inserita con quella attesa a tempo costante (solo runtime Node.js).
 * Si confrontano le impronte SHA-256, che hanno sempre la stessa lunghezza: così il tempo non rivela
 * né i caratteri giusti né la lunghezza della password.
 */
export function passwordMatches(input: unknown, expected: string | undefined): boolean {
  if (typeof input !== "string" || !expected) return false;
  const a = createHash("sha256").update(input, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}
