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
    default: '輝旅 島専科（KIRATABI SHIMASENKA）| 日本全国の離島観光・行き方・制覇ガイド（全529島）',
    template: '%s | 輝旅 島専科（KIRATABI SHIMASENKA）',
  },
  description: '日本全国の有人離島・観光無人島（全529島・上陸制覇対象417島）の行き方・フェリー航路・日帰り可否・ATMや電波などの実用設備情報を完全網羅。GPS・写真チェックインで公式到達証明書も発行できる日本最大級の離島専門ガイド。',
  keywords: ['離島', '日本の島', '離島一覧', '沖縄 離島', '離島 旅行', '離島 日帰り', 'フェリー', '島旅', '離島制覇', '到達証明書', 'キラ旅', '輝旅 島専科', 'KIRATABI SHIMASENKA'],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: '輝旅 島専科（KIRATABI SHIMASENKA）| 日本全国の離島観光・行き方・制覇ガイド',
    description: '日本全国529島（有人離島・観光無人島）の行き方・フェリー・日帰り可否・島内設備を網羅。GPS・写真チェックインで公式到達証明書を発行しよう。',
    url: 'https://island.kira-tabi.com',
    siteName: '輝旅 島専科（KIRATABI SHIMASENKA）',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: '輝旅 島専科 - 日本全国の離島観光・制覇ガイド' }],
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '輝旅 島専科（KIRATABI SHIMASENKA）| 日本全国の離島観光・行き方・制覇ガイド',
    description: '日本全国529島（有人離島・観光無人島）の行き方・フェリー・日帰り可否・島内設備を網羅。GPSチェックインで公式到達証明書を発行しよう。',
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

const siteJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': 'https://island.kira-tabi.com/#website',
      url: 'https://island.kira-tabi.com',
      name: '輝旅 島専科（KIRATABI SHIMASENKA）',
      alternateName: ['キラ旅', 'KIRATABI'],
      description: '日本全国の離島を訪れてスタンプを集めよう。GPS・写真チェックインで公式到達認定。ご当地妖精の図鑑や3D地球儀フライトトラッカーで旅の記録を彩ります。',
      inLanguage: 'ja-JP',
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://island.kira-tabi.com/map?filter={search_term_string}',
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'Organization',
      '@id': 'https://island.kira-tabi.com/#organization',
      name: '輝旅 島専科（KIRATABI SHIMASENKA）',
      url: 'https://island.kira-tabi.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://island.kira-tabi.com/icons/icon-512x512.png',
      },
    },
  ],
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
        />
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
