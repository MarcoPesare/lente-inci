"use client";
import Link from "next/link";
import { useMemo } from "react";
import { analyze, conflicts, FLAGS, type Flag } from "@/lib/inci/engine";
import type { Product } from "@/lib/products";
import { hasProfile, useProfile } from "./ProfileProvider";
import { ScoreBadge } from "./ScoreRing";
import { Thumb } from "./Thumb";
import { useToast } from "./Toast";

export function useFits(p: Product) {
  const { profile } = useProfile();
  return useMemo(() => {
    if (!hasProfile(profile)) return null;
    if (profile.avoidFlags.some((f) => p.flags.includes(f))) return false;
    if (profile.avoidIngr.length && p.inci) return conflicts(analyze(p.inci, p.mode), profile).length === 0;
    return true;
  }, [p, profile]);
}

export function ProductCard({ p }: { p: Product }) {
  const { profile, toggleFav } = useProfile();
  const toast = useToast();
  const fits = useFits(p);
  const fav = profile.favorites.includes(p.id);
  const warn = (["FORM", "BAN", "SIL", "SOL", "ALC"] as Flag[]).filter((f) => p.flags.includes(f));
  return (
    <Link href={`/p/${encodeURIComponent(p.id)}`} className="card">
      <Thumb p={p} />
      <div style={{ minWidth: 0 }}>
        <div className="t">{p.name}</div>
        <div className="s">{p.brand}{p.brand ? " · " : ""}{p.category}</div>
        <div className="chips">
          {!p.inci && <span className="chip mid">INCI mancante</span>}
          {fits === true && <span className="chip good">Adatto a te</span>}
          {fits === false && <span className="chip bad">Non adatto a te</span>}
          {warn.map((f) => <span key={f} className={`chip ${FLAGS[f].tone}`}>{FLAGS[f].label}</span>)}
        </div>
      </div>
      <ScoreBadge score={p.score} />
      <button className="star" type="button" aria-pressed={fav} aria-label={fav ? "Togli dai preferiti" : "Aggiungi ai preferiti"}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); const added = toggleFav(p.id); toast(added ? "Aggiunto ai preferiti." : "Rimosso dai preferiti."); }}>
        {fav ? "★" : "☆"}
      </button>
    </Link>
  );
}

export function CardList({ items, empty }: { items: Product[]; empty: string }) {
  if (!items.length) return <p className="empty">{empty}</p>;
  return <div className="cards">{items.map((p) => <ProductCard key={p.id} p={p} />)}</div>;
}
