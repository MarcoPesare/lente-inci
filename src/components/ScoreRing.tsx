import { scoreTone } from "@/lib/inci/engine";
import { fmtScore } from "@/lib/client";

export function ScoreBadge({ score }: { score: number | null }) {
  const t = scoreTone(score);
  const c = t < 0 ? "--line" : `--r${t}`, b = t < 0 ? "--bg" : `--r${t}bg`;
  return <div className="sc" style={{ ["--sc" as string]: `var(${c})`, ["--scbg" as string]: `var(${b})` }} aria-label={`Voto ${fmtScore(score)} su 20`}>{fmtScore(score)}</div>;
}
export function ScoreRing({ score }: { score: number | null }) {
  const t = scoreTone(score);
  const c = t < 0 ? "--line" : `--r${t}`, b = t < 0 ? "--bg" : `--r${t}bg`;
  return (
    <div className="score" style={{ ["--sc" as string]: `var(${c})`, ["--scbg" as string]: `var(${b})` }}>
      <div><b>{fmtScore(score)}</b><small>su 20</small></div>
    </div>
  );
}
