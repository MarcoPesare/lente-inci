"use client";
import { useEffect, useRef, useState } from "react";

type Detector = { detect: (src: CanvasImageSource) => Promise<{ rawValue: string }[]> };

/**
 * Lettore di codici a barre dal vivo con la fotocamera.
 * Usa il lettore nativo del browser quando c'è (Chrome, Android), altrimenti ZXing (iPhone, Firefox).
 */
export function Scanner({ onCode }: { onCode: (code: string) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<"idle" | "starting" | "on" | "error">("idle");
  const [err, setErr] = useState("");
  const stopRef = useRef<() => void>(() => {});
  const done = useRef(false);

  const stop = () => { stopRef.current(); stopRef.current = () => {}; setState("idle"); };

  async function start() {
    setErr(""); setState("starting"); done.current = false;
    const found = (c: string) => { if (done.current) return; done.current = true; navigator.vibrate?.(60); stop(); onCode(c); };
    try {
      const BD = (window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => Detector }).BarcodeDetector;
      if (BD) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
        const v = video.current!; v.srcObject = stream; await v.play();
        const det = new BD({ formats: ["ean_13", "ean_8", "upc_a", "upc_e"] });
        let alive = true;
        const tick = async () => {
          if (!alive) return;
          try { const r = await det.detect(v); if (r[0]?.rawValue) return found(r[0].rawValue); } catch {}
          setTimeout(tick, 180);
        };
        stopRef.current = () => { alive = false; stream.getTracks().forEach((t) => t.stop()); };
        setState("on"); tick();
      } else {
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        const reader = new BrowserMultiFormatReader();
        const controls = await reader.decodeFromConstraints({ video: { facingMode: { ideal: "environment" } }, audio: false }, video.current!, (res) => { if (res) found(res.getText()); });
        stopRef.current = () => controls.stop();
        setState("on");
      }
    } catch (e) {
      const name = (e as { name?: string })?.name;
      setErr(name === "NotAllowedError" ? "Accesso alla fotocamera negato: consentilo dalle impostazioni del browser, oppure scrivi il codice." : "Non riesco ad aprire la fotocamera. Serve una connessione https; in alternativa scrivi il codice.");
      setState("error");
    }
  }

  useEffect(() => () => stopRef.current(), []);

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div className="scanner" hidden={state !== "on" && state !== "starting"}>
        <video ref={video} playsInline muted />
        <div className="frame" aria-hidden="true" />
      </div>
      <div className="row">
        {state === "on" || state === "starting"
          ? <button className="btn ghost" type="button" onClick={stop}>Chiudi fotocamera</button>
          : <button className="btn" type="button" onClick={start}>Inquadra il codice a barre</button>}
        {state === "starting" && <span className="hint"><span className="spinner" /> Apertura fotocamera…</span>}
      </div>
      {err && <p className="hint warnline">{err}</p>}
    </div>
  );
}
