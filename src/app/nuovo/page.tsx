"use client";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ProductEditor } from "@/components/ProductEditor";

function NewInner() {
  const sp = useSearchParams();
  return (
    <div className="view">
      <h2 className="page-title">Aggiungi un prodotto</h2>
      <ProductEditor initial={{ gtin: sp.get("code") ?? "", inci: sp.get("inci") ?? "", name: sp.get("name") ?? "", mode: sp.get("mode") === "leave" ? "leave" : "rinse" }} />
    </div>
  );
}
export default function NewPage() { return <Suspense><NewInner /></Suspense>; }
