"use client";
import { useMemo, useState } from "react";
import { DICTIONARY, FLAGS, key, RATINGS } from "@/lib/inci/engine";
import { useProfile } from "@/components/ProfileProvider";

export default function IngredientsPage() {
  const { profile, toggleAvoidIngr } = useProfile();
  const [q, setQ] = useState("");
  const list = useMemo(() => { const k = key(q); return DICTIONARY.filter((e) => !k || key(e.name).includes(k) || key(e.fn).includes(k) || e.aliases.some((a) => key(a).includes(k))).slice(0, 150); }, [q]);
  return (
    <div className="view">
      <div className="panel">
        <h2 className="vh">Dizionario ingredienti</h2>
        <div className="field"><label className="label" htmlFor="ing-q">Cerca un ingrediente o una funzione</label>
          <input type="search" id="ing-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="es. dimethicone, conservante, filtro UV" autoComplete="off" /></div>
        <p className="hint">{DICTIONARY.length} ingredienti, più le regole per famiglie (oli vegetali, estratti, siliconi, PEG, coloranti). {q && `${list.length} risultati.`}</p>
      </div>
      <div className="dict">
        {list.map((e) => (
          <details key={e.name}>
            <summary><div><div className="nm">{e.name}</div><div className="fn">{e.fn}</div></div>
              <span className="pill" style={{ ["--pb" as string]: `var(--r${e.r}bg)`, ["--pc" as string]: `var(--r${e.r})` }}>{RATINGS[e.r]}</span></summary>
            <div className="body">
              {e.note && <div>{e.note}</div>}
              {e.aliases.length > 0 && <div className="hint">Anche: {e.aliases.join(", ")}</div>}
              {e.flags.length > 0 && <div className="chips">{e.flags.map((f) => <span key={f} className={`chip ${FLAGS[f].tone}`}>{FLAGS[f].label}</span>)}</div>}
              <div className="row"><button className="btn ghost" type="button" onClick={() => toggleAvoidIngr(e.name)}>
                {profile.avoidIngr.includes(e.name) ? "Togli dalla lista da evitare" : "Aggiungi agli ingredienti da evitare"}</button></div>
            </div>
          </details>
        ))}
        {!list.length && <p className="empty">Nessun ingrediente trovato.</p>}
      </div>
    </div>
  );
}
