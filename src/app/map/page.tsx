import type { Metadata } from 'next';
import GlobalMap from './MapPageClient';

export const metadata: Metadata = {
  title: '全国離島マップ',
  description: '日本全国の離島の位置や難易度を確認できるインタラクティブマップ。',
  openGraph: {
    title: '全国離島マップ | 輝旅 島専科',
    description: '日本全国の離島の位置や難易度を確認できるインタラクティブマップ。',
    images: ['/og-image.png'],
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
