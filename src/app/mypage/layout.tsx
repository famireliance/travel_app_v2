import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'マイページ',
  description: 'あなたの離島制覇記録・訪問済み島一覧・精霊コレクション・旅の証明書。キラ旅マイページで旅の軌跡を振り返ろう。',
  alternates: { canonical: 'https://island.kira-tabi.com/mypage' },
  robots: { index: false, follow: false }, // 個人ページはnoindex
};

export default function MypageLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
