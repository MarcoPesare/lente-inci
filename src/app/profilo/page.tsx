"use client";
import { useState } from "react";
import { DICTIONARY, FLAGS, lookup, type Flag } from "@/lib/inci/engine";
import Link from "next/link";
import { useProfile } from "@/components/ProfileProvider";
import { useToast } from "@/components/Toast";

export default function ProfilePage() {
  const { profile, toggleAvoidFlag, toggleAvoidIngr, eraseAll } = useProfile();
  const toast = useToast();
  const [v, setV] = useState("");
  const keys = (Object.keys(FLAGS) as Flag[]).filter((f) => FLAGS[f].avoid);
  return (
    <div className="view">
      <div className="panel">
        <h2 className="vh">Cosa vuoi evitare</h2>
        <p className="hint">I prodotti che contengono questi ingredienti vengono segnalati come &quot;Non adatto a te&quot; e puoi nasconderli dalla ricerca. Le alternative proposte li escludono.</p>
        <div className="filters">{keys.map((f) => <button key={f} type="button" className="fchip" aria-pressed={profile.avoidFlags.includes(f)} onClick={() => toggleAvoidFlag(f)}>{FLAGS[f].avoid}</button>)}</div>
      </div>
      <div className="panel">
        <span className="label">Ingredienti specifici da evitare</span>
        <form className="row" style={{ flexWrap: "nowrap" }} onSubmit={(e) => { e.preventDefault(); const t = v.trim(); if (!t) return; const name = lookup(t)?.e.name ?? t; if (!profile.avoidIngr.includes(name)) toggleAvoidIngr(name); setV(""); }}>
          <input type="text" list="ing-list" value={v} onChange={(e) => setV(e.target.value)} placeholder="es. Cocamidopropyl Betaine" autoComplete="off" aria-label="Ingrediente da evitare" />
          <button className="btn ghost" type="submit">Aggiungi</button>
        </form>
        <datalist id="ing-list">{DICTIONARY.map((e) => <option key={e.name} value={e.name} />)}</datalist>
        <div className="chips">{profile.avoidIngr.length ? profile.avoidIngr.map((n) => (
          <span key={n} className="chip bad">{n}<button type="button" onClick={() => toggleAvoidIngr(n)} aria-label={`Rimuovi ${n}`}>×</button></span>
        )) : <span className="hint">Nessun ingrediente aggiunto.</span>}</div>
      </div>
      <section className="panel" id="dati">
        <h3 className="sh">I tuoi dati</h3>
        <p className="hint">Il profilo è anonimo: è legato a questo dispositivo con un codice casuale, senza nome né email. Si cancella da solo dopo 12 mesi di inattività.</p>
        <div className="row">
          <button className="btn ghost" type="button" onClick={() => {
            const { favorites, history, avoidFlags, avoidIngr } = profile;
            const url = URL.createObjectURL(new Blob([JSON.stringify({ esportato: new Date().toISOString(), favorites, history, avoidFlags, avoidIngr }, null, 2)], { type: "application/json" }));
            const a = document.createElement("a"); a.href = url; a.download = "lente-inci-dati.json"; a.click(); URL.revokeObjectURL(url);
          }}>Scarica i miei dati</button>
          <button className="btn danger" type="button" onClick={async () => {
            if (!confirm("Cancellare preferiti, cronologia e ingredienti da evitare da questo dispositivo e dal server? Non si può annullare.")) return;
            await eraseAll(); toast("Dati cancellati.");
          }}>Cancella tutti i miei dati</button>
        </div>
        <p className="hint"><Link href="/privacy">Privacy e uso dell&apos;IA</Link></p>
      </section>
      <details className="panel method" id="metodo"><summary><strong>Come viene calcolato il voto</strong></summary>
        <ul>
          <li>Il voto va da 0 a 100 e nasce da regole fisse e pubbliche, non da un&apos;intelligenza artificiale.</li>
          <li>Ogni ingrediente del dizionario ha un giudizio su cinque livelli, da &quot;da evitare&quot; a &quot;ottimo&quot;, basato su sicurezza, tollerabilità e utilità. Riferimenti: regolamento cosmetico UE 1223/2009 e pareri del comitato scientifico europeo SCCS.</li>
          <li>Gli ingredienti che non sono nel dizionario vengono valutati per famiglia quando possibile (oli vegetali, estratti, siliconi, PEG, coloranti…); gli altri non contano.</li>
          <li>Gli ingredienti sono in ordine di quantità decrescente: i primi pesano di più. Dopo circa il decimo, le quantità sono di solito sotto l&apos;1%.</li>
          <li>Nei prodotti da risciacquare, profumi, allergeni, solfati e ingredienti irritanti valgono un gradino in più, perché il contatto dura poco.</li>
          <li>Ingredienti vietati in UE o che rilasciano formaldeide abbassano il voto anche se sono in fondo alla lista.</li>
          <li>Sotto il 70% di ingredienti riconosciuti il voto è segnalato come poco affidabile. Il voto misura la qualità degli ingredienti, non l&apos;efficacia.</li>
        </ul>
      </details>
    </div>
  );
}
