import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import { TravelProvider } from "@/context/TravelContext";
import FairyDiscoveryModal from "@/components/FairyDiscoveryModal";
import AuthReminderBanner from "@/components/AuthReminderBanner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "輝旅　島専科（kiratabi -shimasenka）",
  description: "日本の美しい島々を探求する、究極の島旅プラットフォーム",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <TravelProvider>
          <AuthReminderBanner />
          {children}
          <FairyDiscoveryModal />
        </TravelProvider>
      </body>
    </html>
  );
}
