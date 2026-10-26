import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { ProfileProvider } from "@/components/ProfileProvider";
import { ToastProvider } from "@/components/Toast";
import { CompareBar } from "@/components/CompareBar";
import { SwRegister } from "@/components/SwRegister";

export const metadata: Metadata = {
  title: { default: "Lente INCI", template: "%s · Lente INCI" },
  description: "Analizza gli ingredienti dei cosmetici: cerca per nome o codice a barre e scopri il voto su 20.",
  applicationName: "Lente INCI",
  appleWebApp: { capable: true, title: "Lente INCI", statusBarStyle: "default" },
  icons: { icon: "/icons/icon-192.png", apple: "/icons/apple-touch-icon.png" },
};
export const viewport: Viewport = {
  width: "device-width", initialScale: 1, viewportFit: "cover",
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#fbfcfd" }, { media: "(prefers-color-scheme: dark)", color: "#171c25" }],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" />
      </head>
      <body>
        <ToastProvider>
          <ProfileProvider>
            <Nav />
            <main>{children}</main>
            <CompareBar />
          </ProfileProvider>
        </ToastProvider>
        <SwRegister />
      </body>
    </html>
  );
}
