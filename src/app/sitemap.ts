import { MetadataRoute } from 'next';
import { ALL_ISLANDS_MASTER_DICTIONARY } from '@/data/allIslandsMaster';
import regionsData from '@/data/regions.json';

const BASE_URL = 'https://island.kira-tabi.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // 静的主要ページ
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/map`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/islands`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/ranking`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/timeline`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/packing-list`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/companion`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];

  // 諸島・エリア詳細ページ
  const regionPages: MetadataRoute.Sitemap = regionsData.map((region) => ({
    url: `${BASE_URL}/region/${region.id}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // 島の個別ページ（全506島）
  const islandPages: MetadataRoute.Sitemap = Object.values(ALL_ISLANDS_MASTER_DICTIONARY).map((island) => ({
    url: `${BASE_URL}/island/${island.slug || island.id}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: island.is_conquest_target ? 0.8 : 0.6,
  }));

  return [...staticPages, ...regionPages, ...islandPages];
}
