import { MetadataRoute } from 'next';
import { ALL_ISLANDS_MASTER_DICTIONARY } from '@/data/allIslandsMaster';
import { PREFECTURE_SEO_LIST, FEATURE_SEO_LIST } from '@/data/seoTaxonomies';
import regionsData from '@/data/regions.json';

const BASE_URL = 'https://island.kira-tabi.com';
const CONTENT_LAST_MODIFIED = new Date('2026-11-21T00:00:00+09:00');

export default function sitemap(): MetadataRoute.Sitemap {
  // 静的主要ページ
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: CONTENT_LAST_MODIFIED,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/islands`,
      lastModified: CONTENT_LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 0.95,
    },
    {
      url: `${BASE_URL}/map`,
      lastModified: CONTENT_LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/route-planner`,
      lastModified: CONTENT_LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${BASE_URL}/timeline`,
      lastModified: CONTENT_LAST_MODIFIED,
      changeFrequency: 'daily',
      priority: 0.85,
    },
    {
      url: `${BASE_URL}/ranking`,
      lastModified: CONTENT_LAST_MODIFIED,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/packing-list`,
      lastModified: CONTENT_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.75,
    },
    {
      url: `${BASE_URL}/fairy-gallery`,
      lastModified: CONTENT_LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 0.75,
    },
    {
      url: `${BASE_URL}/companion`,
      lastModified: CONTENT_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/globe`,
      lastModified: CONTENT_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: CONTENT_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: CONTENT_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: CONTENT_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/tokushoho`,
      lastModified: CONTENT_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];

  // 都道府県別・離島一覧ページ（全29都道府県）
  const prefecturePages: MetadataRoute.Sitemap = PREFECTURE_SEO_LIST.map((pref) => ({
    url: `${BASE_URL}/prefecture/${pref.slug}`,
    lastModified: CONTENT_LAST_MODIFIED,
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }));

  // テーマ・検索意図別特集ページ（全11テーマ）
  const featurePages: MetadataRoute.Sitemap = FEATURE_SEO_LIST.map((feat) => ({
    url: `${BASE_URL}/feature/${feat.slug}`,
    lastModified: CONTENT_LAST_MODIFIED,
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }));

  // 諸島・エリア詳細ページ（全45諸島）
  const regionPages: MetadataRoute.Sitemap = regionsData.map((region) => ({
    url: `${BASE_URL}/region/${region.id}`,
    lastModified: CONTENT_LAST_MODIFIED,
    changeFrequency: 'weekly' as const,
    priority: 0.85,
  }));

  // 島の個別ページ（渡航対象369島・重複slug除外）
  const seenSlugs = new Set<string>();
  const islandPages: MetadataRoute.Sitemap = Object.values(ALL_ISLANDS_MASTER_DICTIONARY)
    .filter((island) => {
      if (island.is_conquest_target === false || island.is_published === false) return false;
      const slug = String(island.slug || island.id);
      if (!slug || seenSlugs.has(slug)) return false;
      seenSlugs.add(slug);
      return true;
    })
    .map((island) => ({
      url: `${BASE_URL}/island/${island.slug || island.id}`,
      lastModified: CONTENT_LAST_MODIFIED,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

  return [...staticPages, ...prefecturePages, ...featurePages, ...regionPages, ...islandPages];
}
