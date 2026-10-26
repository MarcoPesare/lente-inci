"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CATEGORIES } from "@/lib/categorize";
import { api, type Product } from "@/lib/client";
import { CardList } from "@/components/ProductCard";
import { hasProfile, useProfile } from "@/components/ProfileProvider";
import { analyze, conflicts } from "@/lib/inci/engine";

const PAGE = 30;

export default function SearchPage() {
  const { profile } = useProfile();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [sort, setSort] = useState<"score" | "name">("score");
  const [onlyOk, setOnlyOk] = useState(false);
  const [items, setItems] = useState<Product[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const req = useRef(0);

  const params = (offset: number) => {
    const sp = new URLSearchParams({ q, sort, limit: String(PAGE), offset: String(offset) });
    if (cat) sp.set("cat", cat);
    if (onlyOk && profile.avoidFlags.length) sp.set("avoid", profile.avoidFlags.join(","));
    return sp.toString();
  };
  const filterIngr = (list: Product[]) =>
    onlyOk && profile.avoidIngr.length ? list.filter((p) => !p.inci || conflicts(analyze(p.inci, p.mode), profile).length === 0) : list;

  useEffect(() => {
    const id = ++req.current;
    setLoading(true);
    const t = setTimeout(() => {
      api<{ items: Product[]; total: number }>(`/api/products?${params(0)}`)
        .then((r) => { if (id !== req.current) return; setItems(filterIngr(r.items)); setTotal(r.total); setError(""); })
        .catch((e) => { if (id === req.current) setError(e.message); })
        .finally(() => { if (id === req.current) setLoading(false); });
    }, q ? 220 : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, cat, sort, onlyOk, profile.avoidFlags.join(","), profile.avoidIngr.join(",")]);

  async function more() {
    setLoading(true);
    try { const r = await api<{ items: Product[] }>(`/api/products?${params(items.length)}`); setItems((x) => [...x, ...filterIngr(r.items)]); }
    finally { setLoading(false); }
  }

  return (
    <div className="view">
      <div className="panel">
        <div className="field"><label className="label" htmlFor="q">Cerca un prodotto</label>
          <input type="search" id="q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nome, marca o codice a barre" autoComplete="off" /></div>
        <div className="filters" role="group" aria-label="Categoria">
          <button type="button" className="fchip" aria-pressed={!cat} onClick={() => setCat("")}>Tutte</button>
          {CATEGORIES.map((c) => <button key={c} type="button" className="fchip" aria-pressed={cat === c} onClick={() => setCat(c)}>{c}</button>)}
        </div>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div className="seg" style={{ minWidth: 220 }} role="group" aria-label="Ordina">
            <button type="button" aria-pressed={sort === "score"} onClick={() => setSort("score")}>Voto più alto</button>
            <button type="button" aria-pressed={sort === "name"} onClick={() => setSort("name")}>Nome A-Z</button>
          </div>
          {hasProfile(profile)
            ? <label className="row" style={{ gap: 6, fontSize: 14 }}><input type="checkbox" checked={onlyOk} onChange={(e) => setOnlyOk(e.target.checked)} /> Solo adatti al mio profilo</label>
            : <Link href="/profilo">Imposta gli ingredienti da evitare</Link>}
        </div>
      </div>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <span className="label">{loading ? "Ricerca…" : total === null ? "" : `${total.toLocaleString("it-IT")} risultat${total === 1 ? "o" : "i"}`}</span>
        <Link className="btn ghost" href="/nuovo">Aggiungi un prodotto</Link>
      </div>
      {error ? <p className="notice warn">{error}</p> : <CardList items={items} empty={loading ? "" : "Nessun prodotto trovato. Prova con meno parole, oppure aggiungilo tu."} />}
      {total !== null && items.length < total && !onlyOk && (
        <div className="row" style={{ justifyContent: "center" }}><button className="btn ghost" type="button" onClick={more} disabled={loading}>Mostra altri</button></div>
      )}
      <p className="hint">Catalogo da <a href="https://world.openbeautyfacts.org" target="_blank" rel="noopener noreferrer">Open Beauty Facts</a>, dati aperti con licenza ODbL inseriti da volontari.</p>
    </div>
  );
}
