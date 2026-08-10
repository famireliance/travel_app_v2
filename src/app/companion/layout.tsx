import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '守護精霊・妖精図鑑',
  description: '日本の離島から生まれた36体の守護精霊たち。島を訪れるたびに精霊と出会い、コレクションを完成させよう。ご当地妖精図鑑・キャラクター一覧。',
  alternates: { canonical: 'https://island.kira-tabi.com/companion' },
  openGraph: {
    title: '守護精霊・妖精図鑑 | キラ旅',
    description: '日本の離島から生まれた36体の守護精霊図鑑。島を旅して全コレクション完成を目指そう。',
    url: 'https://island.kira-tabi.com/companion',
  },
};

export default function CompanionLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
