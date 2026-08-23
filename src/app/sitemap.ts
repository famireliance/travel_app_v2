import { MetadataRoute } from 'next';
import { ALL_ISLANDS_MASTER_DICTIONARY } from '@/data/allIslandsMaster';

const BASE_URL = 'https://island.kira-tabi.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // 静的ページ
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

  // 島の個別ページ（全432島）
  const islandPages: MetadataRoute.Sitemap = Object.values(ALL_ISLANDS_MASTER_DICTIONARY).map((island) => ({
    url: `${BASE_URL}/island/${island.id}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: island.is_conquest_target ? 0.8 : 0.6,
  }));

  return [...staticPages, ...islandPages];
}
