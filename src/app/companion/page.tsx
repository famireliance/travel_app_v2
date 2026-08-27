import type { Metadata } from 'next';
import CompanionClient from './CompanionClient';
import { FAIRIES_MASTER } from '@/lib/fairies';

export const metadata: Metadata = {
  title: '守護精霊・ご当地キャラ大図鑑',
  description: '日本全国の離島を巡って出会うご当地妖精・守護精霊の大図鑑。島を旅してコレクションをコンプリートしよう！',
  openGraph: {
    title: '守護精霊・ご当地キャラ大図鑑 | 輝旅 島専科',
    description: '日本全国の離島を巡って出会うご当地妖精・守護精霊の大図鑑。島を旅してコレクションをコンプリートしよう！',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: '守護精霊・ご当地キャラ大図鑑 | 輝旅 島専科',
    description: '日本全国の離島を巡って出会うご当地妖精・守護精霊の大図鑑。島を旅してコレクションをコンプリートしよう！',
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
