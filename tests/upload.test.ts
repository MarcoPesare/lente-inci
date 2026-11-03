import { test } from "node:test";
import assert from "node:assert/strict";
import { checkContentLength, checkImageUpload, MAX_IMAGE_BYTES, sniffImageType } from "../src/lib/upload";

const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46, 0x49, 0x46, 0, 1, 1, 0, 0, 1]);
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0x0d, 0x49, 0x48, 0x44, 0x52]);
const HEIC = new Uint8Array([0, 0, 0, 0x18, ...Buffer.from("ftypheic"), 0, 0, 0, 0]);

/** Blob grande senza allocare memoria: la dimensione viene da un Blob "vuoto" ripetuto per riferimento. */
const bigBlob = (bytes: number, type: string) => new Blob([new Uint8Array(1024 * 1024)].concat(Array(Math.ceil(bytes / (1024 * 1024)) - 1).fill(new Uint8Array(1024 * 1024))), { type });

test("upload: accetta le immagini raster con tipo dichiarato", async () => {
  for (const type of ["image/jpeg", "image/png", "image/webp", "image/heic", "image/avif", "IMAGE/JPEG"]) {
    assert.deepEqual(await checkImageUpload(new Blob([JPEG], { type })), { ok: true }, type);
  }
});

test("upload: rifiuta i tipi non immagine e l'SVG", async () => {
  for (const [type, body] of [["application/pdf", "%PDF-1.7"], ["text/html", "<html>"], ["image/svg+xml", "<svg onload=alert(1)>"], ["application/zip", "PK"]]) {
    const r = await checkImageUpload(new Blob([body], { type }));
    assert.equal(r.ok, false, type);
    assert.equal(!r.ok && r.status, 415, type);
  }
});

test("upload: senza tipo dichiarato riconosce l'immagine dai primi byte", async () => {
  assert.deepEqual(await checkImageUpload(new Blob([JPEG])), { ok: true });
  assert.deepEqual(await checkImageUpload(new Blob([HEIC], { type: "application/octet-stream" })), { ok: true });
  const r = await checkImageUpload(new Blob(["#!/bin/sh\nrm -rf /"]));
  assert.equal(!r.ok && r.status, 415);
  assert.equal(sniffImageType(PNG), "image/png");
  assert.equal(sniffImageType(HEIC), "image/heic");
  assert.equal(sniffImageType(new Uint8Array([0x3c, 0x73, 0x76, 0x67])), null);
});

test("upload: rifiuta file vuoti, mancanti e oltre il limite delle foto", async () => {
  assert.equal(MAX_IMAGE_BYTES, 15 * 1024 * 1024);
  const empty = await checkImageUpload(new Blob([], { type: "image/jpeg" }));
  assert.equal(!empty.ok && empty.status, 400);
  const none = await checkImageUpload(null);
  assert.equal(!none.ok && none.status, 400);
  const big = await checkImageUpload(bigBlob(MAX_IMAGE_BYTES + 1024 * 1024, "image/jpeg"));
  assert.equal(!big.ok && big.status, 413);
  assert.deepEqual(await checkImageUpload(bigBlob(MAX_IMAGE_BYTES, "image/jpeg")), { ok: true });
});

test("upload: Content-Length troppo grande rifiutato prima di leggere il corpo", () => {
  assert.equal(checkContentLength(String(MAX_IMAGE_BYTES * 2)).ok, false);
  assert.equal(checkContentLength(String(MAX_IMAGE_BYTES)).ok, true);
  assert.equal(checkContentLength(null).ok, true); // intestazione assente: decide il controllo sul file
  assert.equal(checkContentLength("non-numero").ok, true);
});
