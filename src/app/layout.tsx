import type { Metadata, Viewport } from "next";
// Geist dal pacchetto npm (next/font/local): la build non scarica nulla e il browser non contatta Google.
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { ProfileProvider } from "@/components/ProfileProvider";
import { ToastProvider } from "@/components/Toast";
import { CompareBar } from "@/components/CompareBar";
import { SwRegister } from "@/components/SwRegister";

export const metadata: Metadata = {
  title: { default: "Lente INCI", template: "%s · Lente INCI" },
  description: "Analizza gli ingredienti dei cosmetici: cerca per nome o codice a barre e scopri il voto da 0 a 100.",
  applicationName: "Lente INCI",
  appleWebApp: { capable: true, title: "Lente INCI", statusBarStyle: "default" },
  icons: { icon: "/icons/icon-192.png", apple: "/icons/apple-touch-icon.png" },
};
export const viewport: Viewport = {
  width: "device-width", initialScale: 1, viewportFit: "cover",
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#ffffff" }, { media: "(prefers-color-scheme: dark)", color: "#16252b" }],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className={`${GeistSans.variable} ${GeistMono.variable}`}>
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
