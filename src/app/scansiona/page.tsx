"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, type Product } from "@/lib/client";
import { Scanner } from "@/components/Scanner";
import { ScanTabs } from "@/components/ScanTabs";

export default function ScanPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [state, setState] = useState<{ kind: "idle" | "loading" | "missing" | "error"; code?: string; msg?: string }>({ kind: "idle" });

  async function look(raw: string) {
    const c = raw.replace(/\D/g, "");
    if (c.length < 8) { setState({ kind: "error", msg: "Il codice a barre ha di solito 8 o 13 cifre." }); return; }
    setCode(c); setState({ kind: "loading", code: c });
    try {
      const r = await api<{ product: Product }>(`/api/barcode/${c}`);
      router.push(`/p/${encodeURIComponent(r.product.id)}`);
    } catch (e) {
      const s = (e as { status?: number }).status;
      setState(s === 404 ? { kind: "missing", code: c } : { kind: "error", msg: (e as Error).message });
    }
  }

  return (
    <div className="view">
      <ScanTabs />
      <div className="panel scanbox">
        <h2 className="vh">Cerca con il codice a barre</h2>
        <p className="hint">Inquadra il codice a barre con la fotocamera, oppure scrivi le cifre sotto le barre.</p>
        <Scanner onCode={look} />
        <form className="row" style={{ flexWrap: "nowrap" }} onSubmit={(e) => { e.preventDefault(); look(code); }}>
          <input type="text" className="code" inputMode="numeric" placeholder="es. 4066447982596" value={code} onChange={(e) => setCode(e.target.value)} aria-label="Codice a barre" />
          <button className="btn ghost" type="submit">Cerca</button>
        </form>
        {state.kind === "loading" && <p className="hint"><span className="spinner" /> Cerco {state.code} nel database e su Open Beauty Facts…</p>}
        {state.kind === "error" && <p className="hint warnline">{state.msg}</p>}
      </div>
      {state.kind === "missing" && (
        <div className="panel">
          <strong>Nessun prodotto con il codice <span className="code">{state.code}</span>.</strong>
          <p className="hint">Non è nel database e nemmeno su Open Beauty Facts. Aggiungilo tu: fotografa la lista ingredienti e il prodotto, ci vuole un minuto.</p>
          <div><Link className="btn" href={`/nuovo?code=${state.code}`}>Aggiungi questo prodotto</Link></div>
        </div>
      )}
    </div>
  );
}
