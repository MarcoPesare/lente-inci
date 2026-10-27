"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { api, shrinkImage, type Product } from "@/lib/client";
import { CardList } from "@/components/ProductCard";
import { useProfile, hasProfile } from "@/components/ProfileProvider";
import { Report } from "@/components/Report";
import { Thumb } from "@/components/Thumb";
import { useToast } from "@/components/Toast";

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { profile, toggleFav, pushHistory, compare, toggleCompare } = useProfile();
  const toast = useToast();
  const router = useRouter();
  const [p, setP] = useState<Product | null | undefined>(undefined);
  const [alts, setAlts] = useState<Product[]>([]);
  const [photoMsg, setPhotoMsg] = useState("");

  useEffect(() => {
    api<Product>(`/api/products/${encodeURIComponent(id)}`).then((x) => { setP(x); pushHistory(x.id); }).catch(() => setP(null));
  }, [id, pushHistory]);
  useEffect(() => {
    if (!p) return;
    const avoid = profile.avoidFlags.join(",");
    api<{ items: Product[] }>(`/api/products/${encodeURIComponent(p.id)}/alternatives${avoid ? `?avoid=${avoid}` : ""}`).then((r) => setAlts(r.items.slice(0, 3))).catch(() => setAlts([]));
  }, [p, profile.avoidFlags]);

  async function uploadPhoto(file: File) {
    if (!p) return;
    setPhotoMsg("Caricamento della foto…");
    try {
      const fd = new FormData(); fd.append("photo", await shrinkImage(file, 1200), "photo.jpg");
      const r = await api<{ bytes: number }>(`/api/products/${encodeURIComponent(p.id)}/photo`, { method: "POST", body: fd });
      setP({ ...p, hasPhoto: true, photoAt: new Date().toISOString() }); setPhotoMsg(""); toast(`Foto salvata (${Math.round(r.bytes / 1024)} KB).`);
    } catch (e) { setPhotoMsg((e as Error).message); }
  }

  if (p === undefined) return <div className="view"><div className="hero panel skel"><span className="thumb lg" style={{ ["--ts" as string]: "132px" }} /><div className="hero-txt"><i /><i /></div></div></div>;
  if (p === null) return <div className="view"><p className="notice warn">Prodotto non trovato.</p><Link href="/">Torna alla ricerca</Link></div>;
  const fav = profile.favorites.includes(p.id);
  const inCmp = compare.includes(p.id);

  return (
    <div className="view">
      <button type="button" className="back" onClick={() => (history.length > 1 ? router.back() : router.push("/"))}><Icon name="back" size={18} />Indietro</button>
      <div className="hero panel">
        <Thumb p={p} size={132} className="lg" />
        <div className="hero-txt">
          {p.brand && <div className="hero-brand">{p.brand}</div>}
          <h2 className="page-title">{p.name}</h2>
          <div className="hint">{p.category} · {p.mode === "rinse" ? "da risciacquare" : "da lasciare in posa"}</div>
          {p.gtin && <div className="gtin">EAN {p.gtin}</div>}
        </div>
        <div className="actions">
          <button type="button" aria-pressed={fav} onClick={() => { const a = toggleFav(p.id); toast(a ? "Aggiunto ai preferiti." : "Rimosso dai preferiti."); }}>
            <Icon name="star" filled={fav} />{fav ? "Salvato" : "Salva"}</button>
          <button type="button" aria-pressed={inCmp} onClick={() => { const m = toggleCompare(p.id); if (m) toast(m); }}>
            <Icon name="compare" />{inCmp ? "In confronto" : "Confronta"}</button>
          <label className="filebtn">
            <Icon name="camera" />{p.hasPhoto ? "Cambia foto" : "Foto"}
            <input type="file" accept="image/*" capture="environment" aria-label="Foto del prodotto" onChange={(e) => e.target.files?.[0] && uploadPhoto(e.target.files[0])} />
          </label>
          <Link href={`/p/${encodeURIComponent(p.id)}/modifica`}><Icon name="edit" />{p.origin === "obf" ? "Correggi" : "Modifica"}</Link>
        </div>
      </div>
      {photoMsg && <p className="hint">{photoMsg}</p>}
      <div className="panel">
        {p.inci ? <Report inci={p.inci} mode={p.mode} /> : (
          <div className="missing"><b>Manca la lista ingredienti.</b> Fotografa la scritta INCI o Ingredients sulla confezione per completare la scheda e ottenere il voto.
            <div style={{ marginTop: 8 }}><Link className="btn" href={`/p/${encodeURIComponent(p.id)}/modifica`}>Aggiungi l&apos;INCI</Link></div></div>
        )}
      </div>
      <div className="panel">
        <h3 className="sh">Alternative migliori</h3>
        <p className="hint">Stessa categoria, voto più alto{hasProfile(profile) ? ", adatte al tuo profilo" : ""}.</p>
        <CardList items={alts} empty={`Nessuna alternativa con voto più alto${hasProfile(profile) ? " e adatta al tuo profilo" : ""}, per ora.`} />
      </div>
      {p.origin === "obf"
        ? <p className="hint">Dati da <a href={`https://world.openbeautyfacts.org/product/${p.gtin}`} target="_blank" rel="noopener noreferrer">Open Beauty Facts</a> (licenza ODbL), inseriti da volontari: in caso di dubbio vale l&apos;etichetta.</p>
        : p.source && <p className="hint">Fonte INCI: {p.source}. Gli ingredienti in negozio possono cambiare: in caso di dubbio vale l&apos;etichetta.</p>}
    </div>
  );
}
