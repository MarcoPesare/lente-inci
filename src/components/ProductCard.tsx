"use client";
import Link from "next/link";
import { useMemo } from "react";
import { analyze, conflicts, FLAGS, type Flag } from "@/lib/inci/engine";
import type { Product } from "@/lib/products";
import { Icon } from "./Icon";
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

const WARN: Flag[] = ["FORM", "BAN", "SIL", "SOL", "ALC"];

export function ProductCard({ p }: { p: Product }) {
  const { profile, toggleFav } = useProfile();
  const toast = useToast();
  const fits = useFits(p);
  const fav = profile.favorites.includes(p.id);
  const warn = WARN.filter((f) => p.flags.includes(f));
  const shown = warn.slice(0, 2);
  return (
    <Link href={`/p/${encodeURIComponent(p.id)}`} className="card">
      <Thumb p={p} />
      <div className="body">
        <div className="t">{p.name}</div>
        <div className="s">{p.brand && <b>{p.brand}</b>}{p.brand ? " · " : ""}{p.category}</div>
        <div className="chips">
          {!p.inci && <span className="chip mid">INCI mancante</span>}
          {fits === true && <span className="chip good"><Icon name="check" size={12} />Adatto a te</span>}
          {fits === false && <span className="chip bad">Non adatto a te</span>}
          {shown.map((f) => <span key={f} className={`chip ${FLAGS[f].tone}`}>{FLAGS[f].label}</span>)}
          {warn.length > shown.length && <span className="chip">+{warn.length - shown.length}</span>}
        </div>
      </div>
      <div className="side">
        <ScoreBadge score={p.score} />
      </div>
      <button className="star" type="button" aria-pressed={fav} aria-label={fav ? "Togli dai preferiti" : "Aggiungi ai preferiti"}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); const added = toggleFav(p.id); toast(added ? "Aggiunto ai preferiti." : "Rimosso dai preferiti."); }}>
        <Icon name="star" size={18} filled={fav} />
      </button>
    </Link>
  );
}

export function CardList({ items, empty }: { items: Product[]; empty: string }) {
  if (!items.length) return <p className="empty">{empty}</p>;
  return <div className="cards">{items.map((p) => <ProductCard key={p.id} p={p} />)}</div>;
}

/** Scheletro animato mentre la lista si carica. */
export function CardSkeleton({ n = 6 }: { n?: number }) {
  return <div className="cards" aria-hidden="true">{Array.from({ length: n }, (_, i) => <div key={i} className="card skel"><span className="thumb" /><div className="body"><i /><i /></div><span className="sc"><span className="ring" /></span></div>)}</div>;
}
