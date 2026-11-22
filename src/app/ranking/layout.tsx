import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '全国離島制覇ランキング｜島巡りトラベラー番付',
  description: '日本全国の離島（制覇対象417島）を訪れた旅人たちの公式到達数・獲得XPランキング。GPS・写真チェックインで日本の島々を制覇しよう。',
  alternates: { canonical: 'https://island.kira-tabi.com/ranking' },
  openGraph: {
    title: '全国離島制覇ランキング｜島巡りトラベラー番付 | 輝旅 島専科',
    description: '日本全国の離島（制覇対象417島）を訪れた旅人たちの公式到達数・獲得XPランキング。GPS・写真チェックインで日本の島々を制覇しよう。',
    url: 'https://island.kira-tabi.com/ranking',
    siteName: '輝旅 島専科（KIRATABI SHIMASENKA）',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '全国離島制覇ランキング｜島巡りトラベラー番付 | 輝旅 島専科',
    description: '日本全国の離島（制覇対象417島）を訪れた旅人たちの公式到達数・獲得XPランキング。',
    images: ['/og-image.png'],
  },
};

export default function RankingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
