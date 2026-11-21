import type { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import { ALL_ISLANDS_MASTER_DICTIONARY } from '@/data/allIslandsMaster';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function getServerSupabase() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    !process.env.SUPABASE_SERVICE_ROLE_KEY.startsWith('REPLACE')
      ? process.env.SUPABASE_SERVICE_ROLE_KEY
      : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!supabaseUrl || !key || supabaseUrl.includes('placeholder')) {
    return null;
  }
  return createClient(supabaseUrl, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const cleanId = (id || '').replace(/[^a-zA-Z0-9_\-]/g, '');
  const canonicalUrl = `https://island.kira-tabi.com/stay/${encodeURIComponent(id)}`;

  let title = '離島の宿泊施設・ホテル詳細';
  let description =
    '輝旅 島専科（KIRATABI）公認パートナー宿泊施設のご案内。離島のホテル・民宿・ヴィラのプランや設備、アクセス情報を確認できます。';
  let ogImage = '/og-image.png';

  try {
    const client = getServerSupabase();
    if (client && cleanId && cleanId !== 'aogashimaya' && cleanId !== 'demo') {
      let acc: any = null;
      if (UUID_REGEX.test(cleanId)) {
        const { data } = await client
          .from('accommodations')
          .select('id, island_id, name, description, photo_exterior, photo_urls')
          .or(`id.eq.${cleanId},owner_id.eq.${cleanId}`)
          .limit(1)
          .maybeSingle();
        acc = data;
      } else {
        const { data } = await client
          .from('accommodations')
          .select('id, island_id, name, description, photo_exterior, photo_urls')
          .eq('id', cleanId)
          .limit(1)
          .maybeSingle();
        acc = data;
      }

      if (acc?.name) {
        const islandName =
          ALL_ISLANDS_MASTER_DICTIONARY[String(acc.island_id || '').trim()]?.name || '';
        let extCatchphrase = '';
        try {
          const { data: extRow } = await client
            .from('admin_config')
            .select('value')
            .eq('key', `b2b_facility_ext_${acc.id}`)
            .maybeSingle();
          if (extRow?.value) {
            const parsed =
              typeof extRow.value === 'string' ? JSON.parse(extRow.value) : extRow.value;
            if (typeof parsed?.catchphrase === 'string') {
              extCatchphrase = parsed.catchphrase;
            }
          }
        } catch {
          // Ignore optional config lookup error
        }

        title = islandName
          ? `${acc.name}（${islandName}）| 宿泊プラン・予約`
          : `${acc.name} | 離島の宿泊施設・予約`;

        const rawDesc =
          acc.description ||
          extCatchphrase ||
          `${islandName ? `${islandName}の` : ''}公認パートナー宿泊施設「${acc.name}」の宿泊プラン・設備・アクセス情報をご案内します。`;
        description = String(rawDesc).replace(/\s+/g, ' ').trim().slice(0, 150);

        const candidateImg =
          (Array.isArray(acc.photo_exterior) && acc.photo_exterior[0]) ||
          (Array.isArray(acc.photo_urls) && acc.photo_urls[0]) ||
          '';
        if (typeof candidateImg === 'string' && candidateImg.trim()) {
          ogImage = candidateImg.trim();
        }
      }
    }
  } catch {
    // Fall back to default metadata on network/DB errors
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

export default function StayLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
