import type { Metadata } from 'next';
import CompanionClient from './CompanionClient';
import { FAIRIES_MASTER } from '@/lib/fairies';

export const metadata: Metadata = {
  title: '精霊キャラクター図鑑 | キラ旅',
  description: '島を巡ってチェックインすると出会えるご当地妖精の図鑑。全国を飛び回ってコレクションをコンプリートしよう！',
  openGraph: {
    title: '精霊キャラクター図鑑 | キラ旅',
    description: '島を巡ってチェックインすると出会えるご当地妖精の図鑑。全国を飛び回ってコレクションをコンプリートしよう！',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: '精霊キャラクター図鑑 | キラ旅',
    description: '島を巡ってチェックインすると出会えるご当地妖精の図鑑。全国を飛び回ってコレクションをコンプリートしよう！',
    images: ['/og-image.png'],
  },
};

export default function CompanionPage() {
  return (
    <>
      <CompanionClient />
      <div className="sr-only">
        <h2>ご当地妖精キャラクター一覧</h2>
        <ul>
          {FAIRIES_MASTER.map((fairy) => (
            <li key={fairy.id}>
              <h3>{fairy.name}</h3>
              <p>テーマ: {fairy.theme}</p>
              <p>説明: {fairy.description}</p>
              <p>レアリティ: {fairy.rarity}</p>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
