import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const canonicalUrl = `https://island.kira-tabi.com/stay/${id}`;

  return {
    title: '離島の宿泊施設・ホテル詳細',
    description: '輝旅 島専科（KIRATABI）公認パートナー宿泊施設のご案内。離島のホテル・民宿・ヴィラのプランや設備、アクセス情報を確認できます。',
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: '離島の宿泊施設・ホテル詳細 | 輝旅 島専科',
      description: '離島のホテル・民宿・ヴィラの宿泊プランや設備、アクセス情報をご案内します。',
      url: canonicalUrl,
      images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: '離島の宿泊施設・ホテル詳細 | 輝旅 島専科',
      description: '離島のホテル・民宿・ヴィラの宿泊プランや設備、アクセス情報をご案内します。',
      images: ['/og-image.png'],
    },
  };
}

export default function StayLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
