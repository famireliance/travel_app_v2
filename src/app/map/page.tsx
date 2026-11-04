import type { Metadata } from 'next';
import GlobalMap from './MapPageClient';

export const metadata: Metadata = {
  title: '全国離島マップ',
  description: '日本全国の離島の位置や難易度を確認できるインタラクティブマップ。',
  alternates: { canonical: 'https://island.kira-tabi.com/map' },
  openGraph: {
    title: '全国離島マップ | 輝旅 島専科',
    description: '日本全国の離島の位置や難易度を確認できるインタラクティブマップ。',
    url: 'https://island.kira-tabi.com/map',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '全国離島マップ | 輝旅 島専科',
    description: '日本全国の離島の位置や難易度を確認できるインタラクティブマップ。',
    images: ['/og-image.png'],
  },
};

export default function MapPage() {
  return <GlobalMap />;
}
