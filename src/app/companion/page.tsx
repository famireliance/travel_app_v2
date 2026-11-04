import type { Metadata } from 'next';
import CompanionClient from './CompanionClient';
import { FAIRIES_MASTER } from '@/lib/fairies';

export const metadata: Metadata = {
  title: '守護精霊・ご当地キャラ大図鑑',
  description: '日本全国の離島から生まれた全172体の守護妖精・進化パートナー精霊の大図鑑。島を旅してコレクションをコンプリートしよう！',
  alternates: { canonical: 'https://island.kira-tabi.com/companion' },
  openGraph: {
    title: '守護精霊・ご当地キャラ大図鑑 | 輝旅 島専科',
    description: '日本全国の離島から生まれた全172体の守護妖精・進化パートナー精霊の大図鑑。島を旅してコレクションをコンプリートしよう！',
    url: 'https://island.kira-tabi.com/companion',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '守護精霊・ご当地キャラ大図鑑 | 輝旅 島専科',
    description: '日本全国の離島から生まれた全172体の守護妖精・進化パートナー精霊の大図鑑。島を旅してコレクションをコンプリートしよう！',
    images: ['/og-image.png'],
  },
};

export default function CompanionPage() {
  return (
    <>
      <CompanionClient />
    </>
  );
}
