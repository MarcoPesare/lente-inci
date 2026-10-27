"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./Icon";

/** Selettore in cima a Scansiona: codice a barre oppure lista ingredienti (testo o foto dell'etichetta). */
export function ScanTabs() {
  const path = usePathname();
  return (
    <nav className="seg segnav" aria-label="Modalità">
      <Link href="/scansiona" aria-current={path.startsWith("/scansiona") ? "page" : undefined}><Icon name="scan" size={18} />Codice a barre</Link>
      <Link href="/analizza" aria-current={path.startsWith("/analizza") ? "page" : undefined}><Icon name="text" size={18} />Lista ingredienti</Link>
    </nav>
  );
}
