import type { Metadata } from "next";
import { Space_Grotesk, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/CartContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Toast } from "@/components/Toast";
import { CartDrawer } from "@/components/CartDrawer";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-space-grotesk",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
});

export const metadata: Metadata = {
  title: "DentiBox | Insumos Odontológicos",
  description:
    "Insumos odontológicos de calidad: restauración, ortodoncia, bioseguridad e instrumental. Pide contra entrega, entrega rápida.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://dentibox.pages.dev"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${spaceGrotesk.variable} ${inter.variable} ${plexMono.variable} font-sans text-ink`}>
        <CartProvider>
          <Header />
          <main className="min-h-[70vh]">{children}</main>
          <Footer />
          <WhatsAppButton />
          <Toast />
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
