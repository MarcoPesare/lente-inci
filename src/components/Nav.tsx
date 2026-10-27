"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "./Icon";

// "match": le pagine che accendono la scheda (Analizza INCI vive sotto Scansiona)
const TABS: { href: string; label: string; icon: IconName; match: string[] }[] = [
  { href: "/", label: "Cerca", icon: "search", match: ["/", "/p/", "/confronta", "/nuovo"] },
  { href: "/ingredienti", label: "Ingredienti", icon: "flask", match: ["/ingredienti"] },
  { href: "/scansiona", label: "Scansiona", icon: "scan", match: ["/scansiona", "/analizza"] },
  { href: "/preferiti", label: "Preferiti", icon: "star", match: ["/preferiti"] },
  { href: "/profilo", label: "Profilo", icon: "user", match: ["/profilo"] },
];

export function Nav() {
  const path = usePathname();
  if (path === "/login") return null;
  const active = (t: (typeof TABS)[number]) => t.match.some((m) => (m === "/" ? path === "/" : path.startsWith(m)));
  return (
    <>
      <header className="top">
        <div className="top-in">
          <Link href="/" className="brand" aria-label="Lente INCI, home">
            <span className="logo" aria-hidden="true">L</span>
            <span className="wordmark">Lente <span>INCI</span></span>
            <small>beta</small>
          </Link>
          <nav className="topnav" aria-label="Sezioni">
            {TABS.map((t) => (
              <Link key={t.href} href={t.href} aria-current={active(t) ? "page" : undefined}>
                <Icon name={t.icon} size={18} />{t.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <nav className="tabbar" aria-label="Sezioni">
        {TABS.map((t) => (
          <Link key={t.href} href={t.href} aria-current={active(t) ? "page" : undefined} className={t.href === "/scansiona" ? "primary" : undefined}>
            <span className="ico"><Icon name={t.icon} size={t.href === "/scansiona" ? 26 : 22} filled={t.icon === "star" && active(t)} /></span>
            <span className="lbl">{t.label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
