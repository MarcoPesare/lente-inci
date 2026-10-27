import Link from "next/link";

/** Avviso di trasparenza (AI Act, art. 50) accanto a ogni funzione che invia dati a un sistema di IA. */
export function AiNotice() {
  return (
    <p className="ainote">
      <span className="aibadge">IA</span>
      La foto viene inviata a Claude (Anthropic), un sistema di intelligenza artificiale, solo per trascrivere il testo dell&apos;etichetta.
      Non la conserviamo e il risultato può contenere errori: controllalo sempre. <Link href="/privacy#ia">Dettagli</Link>
    </p>
  );
}

export const AI_DONE = "Testo trascritto dall'IA: confrontalo con l'etichetta prima di usarlo.";
