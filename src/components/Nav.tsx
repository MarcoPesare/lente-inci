"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  ["/", "Cerca"], ["/scansiona", "Codice a barre"], ["/analizza", "Analizza INCI"],
  ["/ingredienti", "Ingredienti"], ["/preferiti", "Preferiti"], ["/profilo", "Il mio profilo"],
] as const;

export function Nav() {
  const path = usePathname();
  if (path === "/login") return null;
  const active = (h: string) => (h === "/" ? path === "/" : path.startsWith(h));
  return (
    <header className="top">
      <div className="top-in">
        <div className="brand"><h1>Lente <span>INCI</span></h1><small>beta</small></div>
        <nav className="tabs" aria-label="Sezioni">
          {TABS.map(([h, l]) => (
            <Link key={h} href={h} aria-current={active(h) ? "page" : undefined}>{l}</Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
