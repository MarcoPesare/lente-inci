"use client";
import { useEffect, useState } from "react";
import { api, type Product } from "@/lib/client";
import { CardList } from "@/components/ProductCard";
import { useProfile } from "@/components/ProfileProvider";

export default function FavPage() {
  const { profile, ready } = useProfile();
  const [fav, setFav] = useState<Product[] | null>(null);
  const [hist, setHist] = useState<Product[] | null>(null);
  const favKey = profile.favorites.join(","), histKey = profile.history.slice(0, 15).join(",");
  useEffect(() => { if (!ready) return; if (!favKey) { setFav([]); return; } api<{ items: Product[] }>(`/api/products?ids=${encodeURIComponent(favKey)}`).then((r) => setFav(r.items)).catch(() => setFav([])); }, [favKey, ready]);
  useEffect(() => { if (!ready) return; if (!histKey) { setHist([]); return; } api<{ items: Product[] }>(`/api/products?ids=${encodeURIComponent(histKey)}`).then((r) => setHist(r.items)).catch(() => setHist([])); }, [histKey, ready]);
  return (
    <div className="view">
      <h2 className="vh">Preferiti</h2>
      {fav === null ? <p className="empty"><span className="spinner" /></p> : <CardList items={fav} empty="Nessun preferito. Tocca la stella su un prodotto per salvarlo qui." />}
      <h2 className="vh">Visti di recente</h2>
      {hist === null ? <p className="empty"><span className="spinner" /></p> : <CardList items={hist} empty="Qui compaiono i prodotti che apri." />}
    </div>
  );
}
