"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { analyze, conflicts, FLAGS, scoreTone, type Flag } from "@/lib/inci/engine";
import { api, fmtScore, type Product } from "@/lib/client";
import { hasProfile, useProfile } from "@/components/ProfileProvider";
import { Thumb } from "@/components/Thumb";

const ROWS: Flag[] = ["FORM", "BAN", "ALL", "PROF", "SOL", "SIL", "ALC", "MIN", "POLY", "PEG", "IRR", "ATT"];

function Inner() {
  const ids = (useSearchParams().get("ids") ?? "").split(",").filter(Boolean);
  const { profile, clearCompare } = useProfile();
  const [ps, setPs] = useState<Product[] | null>(null);
  const k = ids.join(",");
  useEffect(() => { api<{ items: Product[] }>(`/api/products?ids=${encodeURIComponent(k)}`).then((r) => setPs(r.items)).catch(() => setPs([])); }, [k]);
  if (!ps) return <p className="empty"><span className="spinner" /></p>;
  if (ps.length < 2) return <p className="notice">Scegli almeno due prodotti con il pulsante &quot;Confronta&quot;.</p>;
  const as = ps.map((p) => analyze(p.inci ?? "", p.mode));
  const common = [...as[0].names].filter((n) => as.every((a) => a.names.has(n)));
  const best = Math.max(...as.map((a) => a.score ?? -1));
  const rows = ROWS.filter((f) => as.some((a) => a.counts[f]));
  return (
    <div className="view">
      <h2 className="page-title">Confronto</h2>
      <div className="panel tablewrap"><table>
        <thead><tr><th></th>{ps.map((p) => <th key={p.id}><div style={{ display: "grid", gap: 6 }}><Thumb p={p} size={48} /><Link href={`/p/${encodeURIComponent(p.id)}`}>{p.name}</Link></div></th>)}</tr></thead>
        <tbody>
          <tr><th>Voto</th>{as.map((a, i) => <td key={i} className="big" style={{ color: `var(--r${Math.max(0, scoreTone(a.score))})` }}>{fmtScore(a.score)}{a.score === best && <> <span className="chip good">migliore</span></>}</td>)}</tr>
          <tr><th>Tipo</th>{ps.map((p) => <td key={p.id}>{p.mode === "leave" ? "In posa" : "Risciacquo"}</td>)}</tr>
          <tr><th>Ingredienti</th>{as.map((a, i) => <td key={i}>{a.total}</td>)}</tr>
          {hasProfile(profile) && <tr><th>Il mio profilo</th>{as.map((a, i) => { const n = conflicts(a, profile).length; return <td key={i}>{n ? <span className="chip bad">{n} da evitare</span> : <span className="chip good">Adatto</span>}</td>; })}</tr>}
          {rows.map((f) => <tr key={f}><th>{FLAGS[f].label}</th>{as.map((a, i) => <td key={i}>{a.counts[f] || "–"}</td>)}</tr>)}
        </tbody>
      </table></div>
      <div className="panel"><span className="label">In comune ({common.length})</span>
        <p className="hint" style={{ fontFamily: "var(--font-mono)" }}>{common.join(", ") || "Nessun ingrediente in comune."}</p></div>
      <div className="row"><button className="btn ghost" type="button" onClick={clearCompare}>Svuota il confronto</button></div>
    </div>
  );
}
export default function ComparePage() { return <Suspense><Inner /></Suspense>; }
