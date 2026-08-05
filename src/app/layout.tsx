import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import { TravelProvider } from "@/context/TravelContext";
import FairyDiscoveryModal from "@/components/FairyDiscoveryModal";
import AuthReminderBanner from "@/components/AuthReminderBanner";
import { Toaster } from 'react-hot-toast';
import GlobalRadar from '@/components/GlobalRadar';
import Footer from '@/components/Footer';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'キラ旅 | 日本の離島制覇アプリ',
  description: '日本全国432の離島を訪れてスタンプを集めよう。GPS・写真チェックインで公式到達認定。ご当地妖精の図鑑や3D地球儀フライトトラッカーで旅の記録を彩ります。',
  openGraph: {
    title: 'キラ旅 | 日本の離島制覇アプリ',
    description: '日本全国432の離島を訪れてスタンプを集めよう',
    url: 'https://island.kira-tabi.com',
    siteName: 'キラ旅',
    images: [{ url: '/logo.png', width: 1200, height: 630 }],
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'キラ旅 | 日本の離島制覇アプリ',
    description: '日本全国432の離島を訪れてスタンプを集めよう',
    images: ['/logo.png'],
  },
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  viewportFit: 'cover',
  themeColor: '#0a0a1a',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#F8FAFC]`}
      >
        <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
        <TravelProvider>
          <AuthReminderBanner />
          {children}
          <FairyDiscoveryModal />
          <GlobalRadar />
          <Footer />
        </TravelProvider>
      </body>
    </html>
  );
}
