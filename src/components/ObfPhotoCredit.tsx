import type { Product } from "@/lib/client";

/** Vero se la miniatura mostrata è la foto del catalogo Open Beauty Facts (non una foto scattata dall'utente). */
export const hasObfPhoto = (p: Pick<Product, "hasPhoto" | "imageUrl">) => !p.hasPhoto && !!p.imageUrl;

/** Attribuzione delle foto Open Beauty Facts (CC BY-SA 3.0): compare solo se almeno un prodotto ne mostra una. */
export function ObfPhotoCredit({ items }: { items: Pick<Product, "hasPhoto" | "imageUrl">[] }) {
  if (!items.some(hasObfPhoto)) return null;
  return (
    <p className="hint photo-credit">
      Foto: <a href="https://world.openbeautyfacts.org" target="_blank" rel="noopener noreferrer">Open Beauty Facts</a>,{" "}
      <a href="https://creativecommons.org/licenses/by-sa/3.0/deed.it" target="_blank" rel="noopener noreferrer">CC BY-SA 3.0</a>
    </p>
  );
}
