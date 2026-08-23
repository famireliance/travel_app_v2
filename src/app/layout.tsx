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
import GoogleAnalytics from '@/components/GoogleAnalytics';
import LevelUpModal from '@/components/LevelUpModal';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://island.kira-tabi.com'),
  title: {
    default: 'キラ旅 | 日本の離島制覇アプリ',
    template: '%s | キラ旅',
  },
  description: '日本全国432の離島を訪れてスタンプを集めよう。GPS・写真チェックインで公式到達認定。ご当地妖精の図鑑や3D地球儀フライトトラッカーで旅の記録を彩ります。',
  keywords: ['離島', '日本の島', '旅行', 'GPS', 'チェックイン', '沖縄', '八重山', '小笠原', '離島制覇', 'キラ旅', '島旅'],
  openGraph: {
    title: 'キラ旅 | 日本の離島432島を制覇しよう',
    description: '日本全国432の離島をGPSチェックインで制覇。守護精霊を集めて、旅の記録を彩ろう。',
    url: 'https://island.kira-tabi.com',
    siteName: 'キラ旅',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'キラ旅 - 日本の離島432島を制覇しよう' }],
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'キラ旅 | 日本の離島432島を制覇しよう',
    description: '日本全国432の離島をGPSチェックインで制覇。守護精霊を集めて旅を記録しよう。',
    images: ['/og-image.png'],
  },
  manifest: '/manifest.json',
  formatDetection: {
    telephone: false,
  },
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
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#F8FAFC]`}
      >
        <GoogleAnalytics />
        <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
        <TravelProvider>
          <AuthReminderBanner />
          {children}
          <FairyDiscoveryModal />
          <LevelUpModal />
          <GlobalRadar />
          <Footer />
        </TravelProvider>
      </body>
    </html>
  );
}
