import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AIアイランドホッピング旅程作成｜離島フェリー乗継ルート自動提案',
  description: '出発地・日数・旅のスタイルを選ぶだけで、実在するフェリー航路・飛行機・連絡橋に基づいた最適な離島巡りモデルコースをAIが無料で自動生成します。',
  alternates: { canonical: 'https://island.kira-tabi.com/route-planner' },
  openGraph: {
    title: 'AIアイランドホッピング旅程作成｜輝旅 島専科',
    description: '出発地・日数・旅のスタイルを選ぶだけで、実在するフェリー航路・飛行機・連絡橋に基づいた最適な離島巡りモデルコースをAIが無料で自動生成します。',
    url: 'https://island.kira-tabi.com/route-planner',
    siteName: '輝旅 島専科（KIRATABI SHIMASENKA）',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AIアイランドホッピング旅程作成｜輝旅 島専科',
    description: '出発地・日数・旅のスタイルを選ぶだけで、最適な離島巡りモデルコースをAIが無料で自動生成します。',
    images: ['/og-image.png'],
  },
};

export default function RoutePlannerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
