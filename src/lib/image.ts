import sharp from "sharp";

export const THUMB_SIZE = 384;

/** Le immagini del catalogo arrivano a 200 px: chiede a Open Beauty Facts la versione a 400 px. */
export function largerObfUrl(url: string): string {
  return url.replace(/\.(100|200)\.(jpe?g|png|webp)$/i, ".400.$2");
}

/** Solo immagini dei progetti Open Facts: l'URL viene dal database ma non vogliamo un proxy aperto. */
export function isAllowedImageUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && /(^|\.)open(beauty|food|products|petfood)facts\.org$/.test(u.hostname);
  } catch {
    return false;
  }
}

/**
 * Miniatura quadrata e uniforme per qualsiasi foto di prodotto.
 * 1. toglie i margini di colore uniforme (bordi bianchi, sfondo del tavolo...);
 * 2. mette il prodotto intero al centro, senza tagli né deformazioni;
 * 3. riempie lo spazio rimasto con il colore medio dei bordi della foto, così foto e sfondo si fondono.
 */
export async function normalizeThumb(input: Buffer, size = THUMB_SIZE): Promise<Buffer> {
  let img = await sharp(input, { failOn: "none" }).rotate().flatten({ background: "#ffffff" }).toBuffer();
  try {
    const t = await sharp(img).trim({ threshold: 18 }).toBuffer({ resolveWithObject: true });
    // se il ritaglio lascia troppo poco (foto quasi uniforme) teniamo l'originale
    if (t.info.width >= 24 && t.info.height >= 24) img = t.data;
  } catch { /* immagine uniforme: niente da togliere */ }

  const inner = Math.round(size * 0.9);
  const fg = await sharp(img).resize(inner, inner, { fit: "inside", kernel: "lanczos3" }).sharpen({ sigma: 0.6 }).toBuffer();
  const background = await edgeColor(fg);
  return sharp({ create: { width: size, height: size, channels: 3, background } })
    .composite([{ input: fg, gravity: "center" }])
    .webp({ quality: 82, effort: 5, smartSubsample: true })
    .toBuffer();
}

/** Colore medio della cornice esterna (2 px) dell'immagine. */
async function edgeColor(img: Buffer): Promise<{ r: number; g: number; b: number }> {
  const { data, info } = await sharp(img).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels: c } = info;
  let r = 0, g = 0, b = 0, n = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (x > 1 && x < w - 2 && y > 1 && y < h - 2) { x = w - 3; continue; }
      const i = (y * w + x) * c;
      r += data[i]; g += data[i + 1]; b += data[i + 2]; n++;
    }
  }
  return { r: Math.round(r / n), g: Math.round(g / n), b: Math.round(b / n) };
}
