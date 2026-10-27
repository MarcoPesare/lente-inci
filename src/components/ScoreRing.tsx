import { scoreTone } from "@/lib/inci/engine";
import { fmtScore } from "@/lib/client";

const SHORT = ["Scarso", "Mediocre", "Discreto", "Buono", "Ottimo"];

function vars(score: number | null) {
  const t = scoreTone(score);
  return { t, style: { ["--sc" as string]: t < 0 ? "var(--muted)" : `var(--r${t})`, ["--scbg" as string]: t < 0 ? "var(--bg)" : `var(--r${t}bg)`, ["--p" as string]: score === null ? 0 : score / 20 } };
}

/** Voto compatto per le liste: anello che si riempie in proporzione al voto, con il giudizio in breve. */
export function ScoreBadge({ score }: { score: number | null }) {
  const { t, style } = vars(score);
  return (
    <div className="sc" style={style} aria-label={score === null ? "Senza voto" : `Voto ${fmtScore(score)} su 100, ${SHORT[t]}`}>
      <span className="ring"><b>{fmtScore(score)}</b></span>
      <span className="w">{t < 0 ? "Senza voto" : SHORT[t]}</span>
    </div>
  );
}

export function ScoreRing({ score }: { score: number | null }) {
  const { style } = vars(score);
  return (
    <div className="score" style={style}>
      <div><b>{fmtScore(score)}</b><small>su 100</small></div>
    </div>
  );
}
