import type { Product } from "@/lib/products";

/** Foto del prodotto: quella scattata dall'utente, altrimenti quella del catalogo, altrimenti l'iniziale. */
export function Thumb({ p, size = 56, className = "thumb" }: { p: Product; size?: number; className?: string }) {
  const src = p.hasPhoto ? `/api/photos/${encodeURIComponent(p.id)}?v=${encodeURIComponent(p.updatedAt)}` : p.imageUrl;
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img className={className} src={src} alt="" width={size} height={size} loading="lazy" decoding="async" style={{ width: size, height: size }} referrerPolicy="no-referrer" />;
  }
  const ini = (p.brand || p.name || "?").trim().slice(0, 1).toUpperCase();
  return <div className={className + " ph"} aria-hidden="true" style={{ width: size, height: size, fontSize: Math.round(size / 3) }}>{ini}</div>;
}
