import type { Metadata } from 'next';
import { getServiceById } from '@/data/islandServicesData';
import { ACTIVITIES_DICTIONARY } from '@/data/islandCategoryData';
import { ALL_ISLANDS_MASTER_DICTIONARY } from '@/data/allIslandsMaster';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const canonicalUrl = `https://island.kira-tabi.com/activity/${encodeURIComponent(id)}`;

  let title = '離島のアクティビティ・体験ツアー詳細';
  let description =
    '輝旅 島専科（KIRATABI）公認の離島アクティビティ・マリン体験・ネイチャーガイドツアーのご案内。コース料金や集合場所、予約方法を確認できます。';
  let ogImage = '/og-image.png';

  const service = getServiceById(id);
  if (service) {
    title = `${service.name}（${service.islandName}）| 離島アクティビティ・体験ツアー`;
    const rawDesc =
      service.description ||
      service.catchphrase ||
      `${service.islandName}の体験ツアー「${service.name}」のコース・料金・予約案内。`;
    description = rawDesc.replace(/\s+/g, ' ').trim().slice(0, 150);
    if (service.photoUrls?.[0]) {
      ogImage = service.photoUrls[0];
    }
  } else {
    for (const [islandKey, list] of Object.entries(ACTIVITIES_DICTIONARY)) {
      const matched = (list || []).find((item) => item.id === id);
      if (matched) {
        const islandName =
          ALL_ISLANDS_MASTER_DICTIONARY[islandKey]?.name ||
          (Number.isNaN(Number(islandKey)) ? islandKey : '');
        title = islandName
          ? `${matched.name}（${islandName}）| 離島アクティビティ・体験ツアー`
          : `${matched.name} | 離島アクティビティ・体験ツアー`;
        description = (
          matched.features ||
          `離島の体験ツアー「${matched.name}」の料金・予約情報をご案内します。`
        )
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

export default function ActivityLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
