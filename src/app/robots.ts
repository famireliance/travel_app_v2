import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/mypage',
          '/order/',
          '/kira-system-panel-9f2',
        ],
      },
    ],
    sitemap: 'https://island.kira-tabi.com/sitemap.xml',
  };
}
