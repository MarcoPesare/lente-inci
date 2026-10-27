"use client";
import type { Product } from "./products";

export type { Product };

export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, init);
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error((j as { error?: string }).error || "Richiesta non riuscita"), { status: r.status, body: j });
  return j as T;
}

/** Riduce una foto nel browser prima dell'invio: meno dati, caricamento più veloce. */
export async function shrinkImage(file: File, max = 1600, quality = 0.85): Promise<Blob> {
  try {
    const bmp = await createImageBitmap(file);
    const s = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s);
    c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
    return await new Promise<Blob>((res) => c.toBlob((b) => res(b ?? file), "image/jpeg", quality));
  } catch { return file; }
}

/** Il voto è salvato su 20 (motore e database), ma si mostra su 100: più immediato da leggere. */
export const fmtScore = (s: number | null | undefined) => (s === null || s === undefined ? "–" : String(Math.round(s * 5)));
export const TONES = ["--r0", "--r1", "--r2", "--r3", "--r4"];
