import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '離島旅行の持ち物チェックリスト｜フェリー船酔い・現金・必需品まとめ',
  description: '初めての離島旅でも安心！ATMがない島での現金準備、船酔い対策、日焼け・虫除け、モバイルバッテリーなど離島ならではの持ち物をチェックリスト形式で管理できます。',
  alternates: { canonical: 'https://island.kira-tabi.com/packing-list' },
  openGraph: {
    title: '離島旅行の持ち物チェックリスト｜輝旅 島専科',
    description: '初めての離島旅でも安心！ATMがない島での現金準備、船酔い対策、日焼け・虫除け、モバイルバッテリーなど離島ならではの持ち物をチェックリスト形式で管理できます。',
    url: 'https://island.kira-tabi.com/packing-list',
    siteName: '輝旅 島専科（KIRATABI SHIMASENKA）',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '離島旅行の持ち物チェックリスト｜輝旅 島専科',
    description: '初めての離島旅でも安心！現金準備や船酔い対策など離島ならではの必需品をチェックリスト形式で管理。',
    images: ['/og-image.png'],
  },
};

export default function PackingListLayout({ children }: { children: React.ReactNode }) {
  return children;
}
