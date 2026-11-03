export const metadata = { title: "Accesso" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const sp = await searchParams;
  return (
    <form className="panel login" method="post" action="/api/login">
      <h2 className="page-title">Lente <span style={{ color: "var(--accent)" }}>INCI</span></h2>
      <p className="hint">Questa è una beta privata. Inserisci la password per entrare.</p>
      <input type="hidden" name="next" value={sp.next ?? "/"} />
      <div className="field"><label className="label" htmlFor="pw">Password</label>
        <input type="password" id="pw" name="password" required autoFocus autoComplete="current-password" style={{ width: "100%", font: "inherit", padding: "10px 12px", borderRadius: 7, border: "1px solid var(--line)", background: "var(--bg)", color: "var(--ink)" }} /></div>
      {sp.error === "config"
        ? <p className="hint warnline">Accesso non disponibile: il server non ha un APP_SECRET valido (almeno 32 caratteri).</p>
        : sp.error && <p className="hint warnline">Password errata.</p>}
      <button className="btn" type="submit">Entra</button>
    </form>
  );
}
