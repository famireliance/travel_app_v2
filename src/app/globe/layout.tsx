import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '3D航空衛星地球儀で見る日本の離島マップ',
  description: '日本列島を取り囲む全481の離島を3Dデジタル地球儀で俯瞰。絶海の孤島から内海の多島美まで立体的に探索できます。',
  alternates: { canonical: 'https://island.kira-tabi.com/globe' },
  openGraph: {
    title: '3D航空衛星地球儀で見る日本の離島マップ | 輝旅 島専科',
    description: '日本列島を取り囲む全481の離島を3Dデジタル地球儀で俯瞰。絶海の孤島から内海の多島美まで立体的に探索できます。',
    url: 'https://island.kira-tabi.com/globe',
    siteName: '輝旅 島専科（KIRATABI SHIMASENKA）',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '3D航空衛星地球儀で見る日本の離島マップ | 輝旅 島専科',
    description: '日本列島を取り囲む全481の離島を3Dデジタル地球儀で俯瞰。',
    images: ['/og-image.png'],
  },
};

export default function GlobeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
