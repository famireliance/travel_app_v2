import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '島旅ランキング',
  description: '日本の離島を最も多く制覇した旅人のランキング。あなたの冒険記録を全国と比べてみよう。到達島数・獲得ポイントで競い合う離島制覇ランキング。',
  alternates: { canonical: 'https://island.kira-tabi.com/ranking' },
  openGraph: {
    title: '島旅ランキング | キラ旅',
    description: '日本の離島を最も多く制覇した旅人のランキング。あなたの記録を全国と比べよう。',
    url: 'https://island.kira-tabi.com/ranking',
  },
};

export default function RankingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
