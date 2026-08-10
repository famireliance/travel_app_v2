import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '全国離島マップ',
  description: '日本全国432の有人・無人離島をインタラクティブマップで探索。地域・難易度でフィルタリングして次の旅先を見つけよう。',
  alternates: { canonical: 'https://island.kira-tabi.com/map' },
  openGraph: {
    title: '全国離島マップ | キラ旅',
    description: '日本全国432の離島をインタラクティブマップで探索。GPS連動で最寄りの島を発見しよう。',
    url: 'https://island.kira-tabi.com/map',
  },
};

export default function MapLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
