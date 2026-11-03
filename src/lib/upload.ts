/** Controlli sulle foto caricate (lettura INCI e foto dei prodotti), prima di leggerle in memoria. */
export const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const MAX_IMAGE_MB = MAX_IMAGE_BYTES / 1024 / 1024;
/** Margine per le intestazioni multipart oltre al file. */
const MULTIPART_OVERHEAD = 64 * 1024;

/** Formati raster accettati. L'SVG è escluso di proposito: è testo e può contenere script. */
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif", "image/avif"] as const;

export type UploadCheck = { ok: true } | { ok: false; status: 400 | 413 | 415; error: string };

const tooLarge: UploadCheck = { ok: false, status: 413, error: `La foto supera i ${MAX_IMAGE_MB} MB` };

/** Rifiuta subito le richieste dichiaratamente troppo grandi, prima di leggere il corpo. */
export function checkContentLength(header: string | null): UploadCheck {
  const n = Number(header);
  return header && Number.isFinite(n) && n > MAX_IMAGE_BYTES + MULTIPART_OVERHEAD ? tooLarge : { ok: true };
}

/** Riconosce i formati raster dai primi byte (per i file senza tipo dichiarato, come alcune HEIC). */
export function sniffImageType(head: Uint8Array): string | null {
  const at = (i: number, ...bytes: number[]) => bytes.every((b, k) => head[i + k] === b);
  const ascii = (i: number, s: string) => at(i, ...Array.from(s, (c) => c.charCodeAt(0)));
  if (at(0, 0xff, 0xd8, 0xff)) return "image/jpeg";
  if (at(0, 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return "image/png";
  if (ascii(0, "GIF87a") || ascii(0, "GIF89a")) return "image/gif";
  if (ascii(0, "RIFF") && ascii(8, "WEBP")) return "image/webp";
  if (ascii(4, "ftyp")) {
    const brand = String.fromCharCode(...head.slice(8, 12));
    if (["avif", "avis"].includes(brand)) return "image/avif";
    if (["heic", "heix", "hevc", "hevx", "heim", "heis", "mif1", "msf1"].includes(brand)) return "image/heic";
  }
  return null;
}

/**
 * Controlla dimensione e tipo del file. Legge al massimo i primi 16 byte, e solo se il tipo dichiarato
 * manca o è generico: il file intero si legge solo dopo che questi controlli sono passati.
 */
export async function checkImageUpload(file: unknown): Promise<UploadCheck> {
  if (!(file instanceof Blob)) return { ok: false, status: 400, error: "Nessuna foto ricevuta" };
  if (file.size === 0) return { ok: false, status: 400, error: "La foto è vuota" };
  if (file.size > MAX_IMAGE_BYTES) return tooLarge;
  const declared = file.type.split(";")[0].trim().toLowerCase();
  if ((IMAGE_TYPES as readonly string[]).includes(declared)) return { ok: true };
  if (declared === "" || declared === "application/octet-stream") {
    if (sniffImageType(new Uint8Array(await file.slice(0, 16).arrayBuffer()))) return { ok: true };
  }
  return { ok: false, status: 415, error: "Il file non è un'immagine supportata (JPEG, PNG, WebP, HEIC, AVIF o GIF)" };
}
