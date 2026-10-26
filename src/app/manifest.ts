import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lente INCI",
    short_name: "Lente INCI",
    description: "Analizza gli ingredienti dei cosmetici.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#eef1f4",
    theme_color: "#2347c5",
    lang: "it",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [{ name: "Codice a barre", url: "/scansiona" }, { name: "Analizza INCI", url: "/analizza" }],
  };
}
