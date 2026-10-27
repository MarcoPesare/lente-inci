"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CATEGORIES } from "@/lib/categorize";
import { api, shrinkImage, type Product } from "@/lib/client";
import { useToast } from "./Toast";
import { AiNotice, AI_DONE } from "@/components/AiNotice";

interface Props { product?: Product | null; initial?: Partial<Product> }

/** Modulo per aggiungere un prodotto, modificarlo o correggere i dati del catalogo. */
export function ProductEditor({ product, initial }: Props) {
  const router = useRouter();
  const toast = useToast();
  const base = product ?? initial ?? {};
  const fromCat = product?.origin === "obf";
  const [f, setF] = useState({
    name: base.name ?? "", brand: base.brand ?? "", category: base.category ?? "Shampoo",
    mode: base.mode ?? "rinse", gtin: base.gtin ?? "", inci: base.inci ?? "",
    source: fromCat ? "Open Beauty Facts, corretto a mano" : base.source ?? "",
  });
  const [photo, setPhoto] = useState<File | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [ocr, setOcr] = useState("");
  const [confirmDel, setConfirmDel] = useState(false);
  const set = (k: keyof typeof f, v: string) => setF((x) => ({ ...x, [k]: v }));

  async function readPhoto(file: File) {
    setOcr("Trascrizione dell'etichetta con l'IA in corso…");
    try {
      const fd = new FormData(); fd.append("photo", await shrinkImage(file), "label.jpg");
      const r = await api<{ inci: string; name: string; brand: string }>("/api/ocr", { method: "POST", body: fd });
      setF((x) => ({ ...x, inci: r.inci, name: x.name || r.name, brand: x.brand || r.brand }));
      setOcr(AI_DONE);
    } catch (e) { setOcr((e as Error).message); }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg("Salvataggio…");
    try {
      const body = JSON.stringify({ ...f, gtin: f.gtin.replace(/\D/g, "") || null, inci: f.inci.trim() || null });
      const saved = product
        ? await api<Product>(`/api/products/${encodeURIComponent(product.id)}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body })
        : await api<Product>("/api/products", { method: "POST", headers: { "Content-Type": "application/json" }, body });
      if (photo) {
        setMsg("Caricamento della foto…");
        const fd = new FormData(); fd.append("photo", await shrinkImage(photo, 1200), "photo.jpg");
        await api(`/api/products/${encodeURIComponent(saved.id)}/photo`, { method: "POST", body: fd }).catch(() => toast("Prodotto salvato, ma la foto non è stata caricata."));
      }
      toast(product ? "Modifiche salvate." : "Prodotto aggiunto.");
      router.push(`/p/${encodeURIComponent(saved.id)}`); router.refresh();
    } catch (err) {
      const e2 = err as Error & { status?: number; body?: { id?: string } };
      setMsg(e2.message + (e2.status === 409 && e2.body?.id ? " Lo trovi aprendo quel codice." : ""));
      setBusy(false);
    }
  }

  async function del() {
    if (!product) return;
    if (!confirmDel) { setConfirmDel(true); return; }
    await api(`/api/products/${encodeURIComponent(product.id)}`, { method: "DELETE" });
    toast("Prodotto eliminato."); router.push("/"); router.refresh();
  }

  return (
    <form className="panel" onSubmit={submit}>
      <div className="two">
        <div className="field"><label className="label" htmlFor="e-name">Nome</label><input type="text" id="e-name" required value={f.name} onChange={(e) => set("name", e.target.value)} /></div>
        <div className="field"><label className="label" htmlFor="e-brand">Marca</label><input type="text" id="e-brand" value={f.brand} onChange={(e) => set("brand", e.target.value)} /></div>
      </div>
      <div className="two">
        <div className="field"><label className="label" htmlFor="e-cat">Categoria</label>
          <select id="e-cat" value={f.category} onChange={(e) => set("category", e.target.value)}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
        <div className="field"><label className="label" htmlFor="e-gtin">Codice a barre (EAN)</label>
          <input type="text" id="e-gtin" className="code" inputMode="numeric" value={f.gtin} readOnly={!!product} onChange={(e) => set("gtin", e.target.value)} /></div>
      </div>
      <div className="field"><span className="label">Tipo</span>
        <div className="seg" role="group" aria-label="Tipo di prodotto">
          <button type="button" aria-pressed={f.mode === "rinse"} onClick={() => set("mode", "rinse")}>Da risciacquare</button>
          <button type="button" aria-pressed={f.mode === "leave"} onClick={() => set("mode", "leave")}>Da lasciare in posa</button>
        </div></div>
      <div className="field"><label className="label" htmlFor="e-inci">Lista ingredienti (INCI)</label>
        <textarea id="e-inci" spellCheck={false} value={f.inci} onChange={(e) => set("inci", e.target.value)} placeholder="Aqua, Glycerin, …" /></div>
      <div className="row">
        <span className="btn ghost filebtn">Leggi l&apos;INCI da una foto
          <input type="file" accept="image/*" capture="environment" aria-label="Foto della lista ingredienti" onChange={(e) => e.target.files?.[0] && readPhoto(e.target.files[0])} /></span>
        <span className="hint">{ocr}</span>
        <AiNotice />
      </div>
      <div className="field"><label className="label" htmlFor="e-photo">Foto del prodotto (facoltativa)</label>
        <span className="hint">Sarà visibile a tutti: inquadra solo il prodotto. Posizione e altri metadati vengono rimossi.</span>
        <input type="file" id="e-photo" accept="image/*" capture="environment" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} /></div>
      <div className="field"><label className="label" htmlFor="e-src">Fonte (facoltativa)</label>
        <input type="text" id="e-src" value={f.source} onChange={(e) => set("source", e.target.value)} placeholder="es. etichetta, scheda dm.it" /></div>
      <div className="row">
        <button className="btn" type="submit" disabled={busy}>{product ? "Salva le modifiche" : "Aggiungi il prodotto"}</button>
        {product && !fromCat && <button className="btn danger" type="button" onClick={del}>{confirmDel ? "Conferma: elimina" : "Elimina"}</button>}
      </div>
      {msg && <p className="hint">{msg}</p>}
    </form>
  );
}
