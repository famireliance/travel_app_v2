import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI 島巡りルートプランナー',
  description: '出発地・日数・旅のテーマを入力するだけで、最新AIがフェリー航路やアクセスを考慮した最適なアイランドホッピング（島巡り）プランを提案します。',
  alternates: { canonical: 'https://island.kira-tabi.com/route-planner' },
  openGraph: {
    title: 'AI 島巡りルートプランナー | 輝旅 島専科',
    description: '最新AIがあなただけの離島アイランドホッピング旅程を自動作成。',
    url: 'https://island.kira-tabi.com/route-planner',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI 島巡りルートプランナー | 輝旅 島専科',
    description: '最新AIがあなただけの離島アイランドホッピング旅程を自動作成。',
    images: ['/og-image.png'],
  },
};

export default function RoutePlannerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
