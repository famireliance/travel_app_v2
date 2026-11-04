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
          '/biz-portal-secure-8f92a1b3',
          '/demo/',
          '/manual.html',
          '/operation-manual.html',
        ],
      },
    ],
    sitemap: 'https://island.kira-tabi.com/sitemap.xml',
  };
}
