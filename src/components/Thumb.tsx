"use client";
import { useState } from "react";
import type { Product } from "@/lib/products";

/**
 * Miniatura del prodotto, normalizzata dal server (/api/img): quadrata, prodotto intero, senza bande.
 * Se non c'è nessuna immagine, o non si carica, mostra l'iniziale della marca.
 */
export function Thumb({ p, size = 64, className = "" }: { p: Product; size?: number; className?: string }) {
  const src = p.hasPhoto || p.imageUrl ? `/api/img/${encodeURIComponent(p.id)}?v=${encodeURIComponent(p.photoAt ?? p.updatedAt)}` : null;
  const [failed, setFailed] = useState<string | null>(null);
  const box = { ["--ts" as string]: `${size}px` };
  if (src && failed !== src) {
    return (
      <span className={`thumb ${className}`} style={box}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" width={size} height={size} loading="lazy" decoding="async" onError={() => setFailed(src)} />
      </span>
    );
  }
  const ini = (p.brand || p.name || "?").trim().slice(0, 1).toUpperCase();
  return <span className={`thumb ph ${className}`} aria-hidden="true" style={{ ...box, fontSize: Math.round(size / 2.6) }}>{ini}</span>;
}
