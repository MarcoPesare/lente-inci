"use client";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { api, type Product } from "@/lib/client";
import { ProductEditor } from "@/components/ProductEditor";

export default function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [p, setP] = useState<Product | null | undefined>(undefined);
  useEffect(() => { api<Product>(`/api/products/${encodeURIComponent(id)}`).then(setP).catch(() => setP(null)); }, [id]);
  if (p === undefined) return <p className="empty"><span className="spinner" /> Caricamento…</p>;
  if (p === null) return <p className="notice warn">Prodotto non trovato.</p>;
  return (
    <div className="view">
      <Link className="back" href={`/p/${encodeURIComponent(p.id)}`}>← {p.name}</Link>
      <h2 className="page-title">{p.origin === "obf" ? "Correggi i dati del catalogo" : "Modifica prodotto"}</h2>
      <ProductEditor product={p} />
    </div>
  );
}
