"use client";
import Link from "next/link";
import { useState } from "react";
import { api, shrinkImage } from "@/lib/client";
import { Report } from "@/components/Report";
import type { Mode } from "@/lib/inci/engine";

const EXAMPLE = "Aqua, Alcohol, Betaine, Glucomannan, Sodium Benzoate, Parfum, Glycerin, Potassium Sorbate, Citric Acid, Algin, Caesalpinia Spinosa Gum, Levulinic Acid, Sodium Levulinate, Linum Usitatissimum Seed Extract, Benzyl Alcohol, Citronellol, Linalool, Limonene";

export default function AnalyzePage() {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<Mode>("rinse");
  const [name, setName] = useState("");
  const [ocr, setOcr] = useState("");

  async function readPhoto(file: File) {
    setOcr("Lettura dell'etichetta in corso…");
    try {
      const fd = new FormData(); fd.append("photo", await shrinkImage(file), "label.jpg");
      const r = await api<{ inci: string; name: string }>("/api/ocr", { method: "POST", body: fd });
      setText(r.inci); if (r.name && !name) setName(r.name); setOcr("Fatto: controlla il testo.");
    } catch (e) { setOcr((e as Error).message); }
  }

  return (
    <div className="view">
      <div className="panel">
        <h2 className="vh">Analizza una lista ingredienti</h2>
        <div className="field"><label className="label" htmlFor="a-name">Nome del prodotto (facoltativo)</label>
          <input type="text" id="a-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="es. Balea shampoo antiforfora menta" /></div>
        <div className="field"><span className="label">Tipo di prodotto</span>
          <div className="seg" role="group" aria-label="Tipo di prodotto">
            <button type="button" aria-pressed={mode === "rinse"} onClick={() => setMode("rinse")}>Da risciacquare</button>
            <button type="button" aria-pressed={mode === "leave"} onClick={() => setMode("leave")}>Da lasciare in posa</button>
          </div></div>
        <div className="field"><label className="label" htmlFor="a-text">Lista ingredienti (INCI)</label>
          <textarea id="a-text" spellCheck={false} value={text} onChange={(e) => setText(e.target.value)} placeholder="Aqua, Glycerin, Coco-Glucoside, …" />
          <p className="hint">Va bene qualsiasi separatore: virgole, barre verticali, punti e virgola o a capo.</p></div>
        <div className="row">
          <span className="btn ghost filebtn">Leggi l&apos;INCI da una foto
            <input type="file" accept="image/*" capture="environment" aria-label="Foto della lista ingredienti" onChange={(e) => e.target.files?.[0] && readPhoto(e.target.files[0])} /></span>
          <button className="btn ghost" type="button" onClick={() => { setText(EXAMPLE); setMode("leave"); setName("Esempio: gel per capelli"); }}>Inserisci un esempio</button>
          {text.trim() && <Link className="btn" href={`/nuovo?${new URLSearchParams({ inci: text, name, mode })}`}>Salva come prodotto</Link>}
        </div>
        {ocr && <p className="hint">{ocr}</p>}
      </div>
      <div className="panel">{text.trim() ? <Report inci={text} mode={mode} /> : <p className="empty">Incolla una lista ingredienti per vedere voto e schede.</p>}</div>
    </div>
  );
}
