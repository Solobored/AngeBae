import type React from "react";
import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const playfairDisplay = Playfair_Display({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ABT - angebae & beauty therapist - Productos de Cuidado Facial",
  description:
    "Los mejores productos para el cuidado de tu piel. Serums, cremas, limpiadores y más.",
  keywords:
    "skincare, cuidado facial, cosméticos, belleza, productos naturales, angebae, beauty therapist, ABT",
  generator: "v0.dev",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${playfairDisplay.variable}`}>
      <body className="antialiased font-inter bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
