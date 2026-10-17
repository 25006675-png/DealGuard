import type { Metadata } from "next";
import { Archivo, Herr_Von_Muellerhoff, IBM_Plex_Mono, IBM_Plex_Sans, Newsreader } from "next/font/google";
import "./globals.css";
import "./landing.css";

const plexSans = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-plex-sans" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-plex-mono" });
const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-archivo" });
const newsreader = Newsreader({ subsets: ["latin"], axes: ["opsz"], style: ["normal", "italic"], variable: "--font-newsreader" });
const signature = Herr_Von_Muellerhoff({ subsets: ["latin"], weight: "400", variable: "--font-sign" });

export const metadata: Metadata = {
  title: "DealGuard MY",
  description: "Commercial decision support for Malaysian SME construction subcontractors, powered by Claude on Amazon Bedrock.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" className={`${plexSans.variable} ${plexMono.variable} ${newsreader.variable} ${archivo.variable} ${signature.variable}`}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
