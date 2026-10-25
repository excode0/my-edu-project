import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteThemeProvider } from "@/components/providers/site-theme-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SMA Cendekia Nusantara | Profil Sekolah",
  description: "Profil SMA Cendekia Nusantara, program pendidikan, prestasi, dan informasi penerimaan siswa baru.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SiteThemeProvider>{children}</SiteThemeProvider>
      </body>
    </html>
  );
}
