"use client";
import Link from "next/link";
import { useProfile } from "./ProfileProvider";

export function CompareBar() {
  const { compare, clearCompare } = useProfile();
  if (!compare.length) return null;
  return (
    <div className="cmpbar"><div className="in">
      <span style={{ fontSize: 14 }}>Confronto: {compare.length} prodott{compare.length === 1 ? "o" : "i"}</span>
      <div className="row">
        <button className="linkbtn" type="button" onClick={clearCompare}>Svuota</button>
        {compare.length < 2
          ? <button className="btn" type="button" disabled>Scegline un altro</button>
          : <Link className="btn" href={`/confronta?ids=${compare.map(encodeURIComponent).join(",")}`}>Confronta {compare.length}</Link>}
      </div>
    </div></div>
  );
}
