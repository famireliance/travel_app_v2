import type { Metadata } from 'next';
import regionsData from '@/data/regions.json';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id: rawRegionId } = await params;
  let decodedRegionId = rawRegionId;
  try {
    decodedRegionId = decodeURIComponent(rawRegionId);
  } catch {}

  const region = regionsData.find(
    (r) =>
      r.id === rawRegionId ||
      r.id === decodedRegionId ||
      r.name === rawRegionId ||
      r.name === decodedRegionId ||
      r.area === rawRegionId ||
      r.area === decodedRegionId
  );

  const regionName = region ? region.name : '諸島・エリア';
  const areaName = region?.area ? `（${region.area}）` : '';
  const totalCount = region?.total ? `全${region.total}島` : '各離島';
  const canonicalId = region ? region.id : rawRegionId;
  const canonicalUrl = `https://island.kira-tabi.com/region/${canonicalId}`;
  const ogImageUrl = region?.hero_image_url || '/og-image.png';

  const title = `${regionName}の離島マップ・観光ガイド`;
  const ogTitle = `${regionName}の離島マップ・観光ガイド | 輝旅 島専科`;
  const description = `${regionName}${areaName}に属する${totalCount}の位置・アクセス難易度・宿泊施設・観光情報をインタラクティブマップで探索。輝旅 島専科（KIRATABI）で${regionName}の島旅をはじめよう。`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: ogTitle,
      description,
      url: canonicalUrl,
      siteName: '輝旅 島専科（KIRATABI SHIMASENKA）',
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: `${regionName} | 輝旅 島専科` }],
      locale: 'ja_JP',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description,
      images: [ogImageUrl],
    },
  };
}

export default function RegionLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
