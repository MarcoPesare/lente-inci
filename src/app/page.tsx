"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CATEGORIES } from "@/lib/categorize";
import { api, type Product } from "@/lib/client";
import { CardList, CardSkeleton } from "@/components/ProductCard";
import { Icon } from "@/components/Icon";
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
      <div className="searchbar">
        <label className="search">
          <Icon name="search" size={20} />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cerca prodotto, marca o codice" autoComplete="off" aria-label="Cerca un prodotto" enterKeyHint="search" />
          {q && <button type="button" className="clear" onClick={() => setQ("")} aria-label="Cancella"><Icon name="close" size={16} /></button>}
        </label>
        <Link href="/scansiona" className="scanbtn" aria-label="Scansiona il codice a barre"><Icon name="scan" size={22} /></Link>
      </div>

      <div className="hscroll" role="group" aria-label="Categoria">
        <button type="button" className="fchip" aria-pressed={!cat} onClick={() => setCat("")}>Tutte</button>
        {CATEGORIES.map((c) => <button key={c} type="button" className="fchip" aria-pressed={cat === c} onClick={() => setCat(cat === c ? "" : c)}>{c}</button>)}
      </div>

      <div className="toolbar">
        <span className="count">{total === null ? " " : `${total.toLocaleString("it-IT")} prodott${total === 1 ? "o" : "i"}`}</span>
        <div className="row" style={{ gap: 6 }}>
          {hasProfile(profile)
            ? <button type="button" className="fchip sm" aria-pressed={onlyOk} onClick={() => setOnlyOk(!onlyOk)}>{onlyOk && <Icon name="check" size={14} />}Adatti a me</button>
            : <Link className="fchip sm" href="/profilo">Imposta cosa evitare</Link>}
          <label className="selectwrap">
            <span className="sr">Ordina</span>
            <select value={sort} onChange={(e) => setSort(e.target.value as "score" | "name")}>
              <option value="score">Voto più alto</option>
              <option value="name">Nome A-Z</option>
            </select>
          </label>
        </div>
      </div>

      {error ? <p className="notice warn">{error}</p>
        : loading && !items.length ? <CardSkeleton />
        : <CardList items={items} empty={loading ? "" : "Nessun prodotto trovato. Prova con meno parole, oppure aggiungilo tu."} />}
      {total !== null && items.length < total && !onlyOk && (
        <div className="row" style={{ justifyContent: "center" }}><button className="btn ghost" type="button" onClick={more} disabled={loading}>{loading ? "Carico…" : "Mostra altri"}</button></div>
      )}
      <div className="row" style={{ justifyContent: "space-between" }}>
        <p className="hint">
          Catalogo: <a href="https://world.openbeautyfacts.org" target="_blank" rel="noopener noreferrer">© Open Beauty Facts contributors</a>, <a href="https://opendatacommons.org/licenses/odbl/1-0/" target="_blank" rel="noopener noreferrer">ODbL</a>.
          Foto dei prodotti: <a href="https://creativecommons.org/licenses/by-sa/3.0/deed.it" target="_blank" rel="noopener noreferrer">CC BY-SA 3.0</a>. <Link href="/privacy">Privacy</Link>
        </p>
        <Link className="btn ghost sm" href="/nuovo"><Icon name="plus" size={16} />Aggiungi un prodotto</Link>
      </div>
    </div>
  );
}
