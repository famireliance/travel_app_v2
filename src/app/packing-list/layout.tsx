import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '離島旅の持ち物チェックリスト',
  description: '船酔い対策・マリンシューズ・モバイルバッテリー・現金準備など、日本の離島旅行に必須の持ち物チェックリスト。自分だけのカスタムリストも作成可能。',
  alternates: { canonical: 'https://island.kira-tabi.com/packing-list' },
  openGraph: {
    title: '離島旅の持ち物チェックリスト | 輝旅 島専科',
    description: '日本の離島旅行に必須の持ち物・便利グッズをチェックリストで管理しよう。',
    url: 'https://island.kira-tabi.com/packing-list',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '離島旅の持ち物チェックリスト | 輝旅 島専科',
    description: '日本の離島旅行に必須の持ち物・便利グッズをチェックリストで管理しよう。',
    images: ['/og-image.png'],
  },
};

export default function PackingListLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
