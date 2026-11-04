import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '3D地球儀＆フライト・航路トラッカー',
  description: '日本全国の離島への到達軌跡を3D衛星マップ・航路トラッカーで可視化。あなたが旅した島々を結ぶデジタル航海図。',
  alternates: { canonical: 'https://island.kira-tabi.com/globe' },
  openGraph: {
    title: '3D地球儀＆フライト・航路トラッカー | 輝旅 島専科',
    description: '日本全国の離島への到達軌跡を3D衛星マップ・航路トラッカーで可視化。',
    url: 'https://island.kira-tabi.com/globe',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '3D地球儀＆フライト・航路トラッカー | 輝旅 島専科',
    description: '日本全国の離島への到達軌跡を3D衛星マップ・航路トラッカーで可視化。',
    images: ['/og-image.png'],
  },
};

export default function GlobeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
