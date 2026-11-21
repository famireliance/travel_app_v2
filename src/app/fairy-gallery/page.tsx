import { Metadata } from 'next';
import FairyGalleryClient from './components/FairyGalleryClient';

export const metadata: Metadata = {
  title: 'ご当地妖精ずかん',
  description: '全国の離島に生息する全172体の守護妖精コレクション図鑑。旅の記録とともに妖精たちを発見しよう。',
  alternates: {
    canonical: 'https://island.kira-tabi.com/fairy-gallery',
  },
  openGraph: {
    title: 'ご当地妖精ずかん | 輝旅 島専科',
    description: '全国の離島に生息する全172体の守護妖精コレクション図鑑。旅の記録とともに妖精たちを発見しよう。',
    url: 'https://island.kira-tabi.com/fairy-gallery',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ご当地妖精ずかん | 輝旅 島専科',
    description: '全国の離島に生息する全172体の守護妖精コレクション図鑑。旅の記録とともに妖精たちを発見しよう。',
    images: ['/og-image.png'],
  },
};

export default function FairyGallery() {
  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
      <FairyGalleryClient />
    </div>
  );
}
