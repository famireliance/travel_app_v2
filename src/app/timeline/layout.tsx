import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'みんなの島ノート',
  description: 'キラ旅ユーザーが投稿する島旅の記録・写真・感想。日本全国の離島を旅した人々のリアルな体験を読んで、あなたの旅にインスピレーションを。',
  alternates: { canonical: 'https://island.kira-tabi.com/timeline' },
  openGraph: {
    title: 'みんなの島ノート | 輝旅 島専科',
    description: 'キラ旅ユーザーの島旅記録・写真・感想。日本の離島旅行のリアルな体験談。',
    url: 'https://island.kira-tabi.com/timeline',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'みんなの島ノート | 輝旅 島専科',
    description: 'キラ旅ユーザーの島旅記録・写真・感想。日本の離島旅行のリアルな体験談。',
    images: ['/og-image.png'],
  },
};

export default function TimelineLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
