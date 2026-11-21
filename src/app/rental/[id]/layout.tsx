import type { Metadata } from 'next';
import { getServiceById } from '@/data/islandServicesData';
import { ISLAND_FACILITIES_DICTIONARY } from '@/data/islandFacilitiesData';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const canonicalUrl = `https://island.kira-tabi.com/rental/${encodeURIComponent(id)}`;

  let title = '離島のレンタカー・島内モビリティ予約';
  let description =
    '輝旅 島専科（KIRATABI）公認の離島レンタカー・電動バイク・レンタサイクルのご案内。港・空港配車対応プランや料金を確認できます。';
  let ogImage = '/og-image.png';

  const service = getServiceById(id);
  if (service) {
    title = `${service.name}（${service.islandName}）| 離島レンタカー・モビリティ予約`;
    const rawDesc =
      service.description ||
      service.catchphrase ||
      `${service.islandName}のレンタカー「${service.name}」の料金プラン・配車案内。`;
    description = rawDesc.replace(/\s+/g, ' ').trim().slice(0, 150);
    if (service.photoUrls?.[0]) {
      ogImage = service.photoUrls[0];
    }
  } else {
    for (const facData of Object.values(ISLAND_FACILITIES_DICTIONARY)) {
      const transport = (facData.transports || []).find((t) => t.id === id);
      if (transport) {
        title = `${transport.name}（${facData.islandName}）| 離島レンタカー・交通案内`;
        description = `${facData.islandName}の「${transport.name}」のご案内。${transport.features || ''}`
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 150);
        break;
      }
    }
  }

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${title} | 輝旅 島専科`,
      description,
      url: canonicalUrl,
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | 輝旅 島専科`,
      description,
      images: [ogImage],
    },
  };
}

export default function RentalLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
