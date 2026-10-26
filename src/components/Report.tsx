"use client";
import { analyze, conflicts, FLAGS, key, RATINGS, verdict, type Flag, type Mode } from "@/lib/inci/engine";
import { hasProfile, useProfile } from "./ProfileProvider";
import { ScoreRing } from "./ScoreRing";

const ORDER: Flag[] = ["FORM", "BAN", "ALL", "PROF", "SOL", "SIL", "ALC", "MIN", "POLY", "PEG", "IRR", "ATT"];

export function Report({ inci, mode }: { inci: string; mode: Mode }) {
  const { profile } = useProfile();
  const a = analyze(inci, mode);
  const cov = Math.round(a.coverage * 100);
  const cf = hasProfile(profile) ? conflicts(a, profile) : null;
  const hit = new Set((cf ?? []).map((x) => x.name));
  const summary = ORDER.filter((f) => a.counts[f]);
  return (
    <>
      <div className="verdict">
        <ScoreRing score={a.score} />
        <div>
          <h3>{verdict(a.score)}</h3>
          <p>{a.total} ingredienti · {mode === "rinse" ? "da risciacquare" : "da lasciare in posa"}</p>
          <p className={cov < 70 ? "warnline" : ""} style={{ fontSize: 13 }}>{cov}% degli ingredienti riconosciuti{cov < 70 ? ": voto poco affidabile" : ""}</p>
        </div>
      </div>
      {cf && (cf.length
        ? <div className="conflict"><b>Non adatto al tuo profilo.</b> Contiene {cf.map((x) => `${x.name} (${x.why.join(", ")})`).join("; ")}.</div>
        : <div className="okbox"><b>Adatto al tuo profilo:</b> nessuno degli ingredienti che vuoi evitare.</div>)}
      <div style={{ display: "grid", gap: 6 }}>
        <div className="bar" aria-hidden="true">{a.dist.map((d, i) => d ? <i key={i} style={{ flex: d, background: `var(--r${i})` }} /> : null)}</div>
        <div className="legend">{RATINGS.map((t, i) => <span key={t} style={{ ["--c" as string]: `var(--r${i})` }}>{t} {a.dist[i]}</span>)}</div>
      </div>
      <div style={{ display: "grid", gap: 6 }}>
        <span className="label">Da sapere</span>
        <div className="chips">{summary.length ? summary.map((f) => <span key={f} className={`chip ${FLAGS[f].tone}`}>{FLAGS[f].label} · {a.counts[f]}</span>) : <span className="chip good">Nessuna segnalazione</span>}</div>
      </div>
      <div style={{ display: "grid", gap: 6 }}>
        <span className="label">Ingredienti, in ordine di quantità</span>
        <div className="list">
          {a.rows.map((r) => {
            const tail = r.pos === 11 && a.rows.length > 12 ? <div key={"t" + r.pos} className="tail">Da qui in poi gli ingredienti sono di solito sotto l&apos;1%.</div> : null;
            if (!r.m) return [tail, (
              <div key={r.pos} className="ing unk"><span className="pos">{r.pos}</span>
                <div><div className="nm">{r.raw}</div><div className="fn">Non riconosciuto: non conta nel voto.</div></div>
                <span className="pill" style={{ ["--pb" as string]: "var(--bg)", ["--pc" as string]: "var(--muted)" }}>–</span></div>)];
            const e = r.m.e; const ri = r.dup ? e.r : r.eff!;
            const alias = !e.family && (r.m.fuzzy || key(r.raw) !== key(e.name));
            return [tail, (
              <div key={r.pos} className={`ing${r.dup ? " dup" : ""}${hit.has(e.name) && !r.dup ? " hit" : ""}`}>
                <span className="pos">{r.pos}</span>
                <div>
                  <div className="nm">{e.name}{alias && <em> scritto &quot;{r.raw}&quot;</em>}</div>
                  <div className="fn">{e.fn}{r.dup ? " · ripetuto, conta una volta" : ""}</div>
                  {e.note && <div className="note">{e.note}</div>}
                  {e.flags.length > 0 && <div className="chips">{e.flags.map((f) => <span key={f} className={`chip ${FLAGS[f].tone}`}>{FLAGS[f].label}</span>)}</div>}
                </div>
                <span className="pill" style={{ ["--pb" as string]: `var(--r${ri}bg)`, ["--pc" as string]: `var(--r${ri})` }}>{RATINGS[ri]}</span>
              </div>)];
          })}
        </div>
      </div>
    </>
  );
}
