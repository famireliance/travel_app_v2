import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '日本全国離島マップ | キラ旅',
  description: '日本全国432島の位置情報、難易度、チェックイン状況を確認できるインタラクティブな離島マップです。',
};

export default function MapLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
