import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '全国離島マップ',
  description: '日本全国の有人・無人離島をインタラクティブマップで探索。地域・難易度でフィルタリングして次の旅先を見つけよう。',
  alternates: { canonical: 'https://island.kira-tabi.com/map' },
  openGraph: {
    title: '全国離島マップ | 輝旅 島専科',
    description: '日本全国の離島をインタラクティブマップで探索。GPS連動で最寄りの島を発見しよう。',
    url: 'https://island.kira-tabi.com/map',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '全国離島マップ | 輝旅 島専科',
    description: '日本全国の離島をインタラクティブマップで探索。GPS連動で最寄りの島を発見しよう。',
    images: ['/og-image.png'],
  },
};

export default function MapLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
