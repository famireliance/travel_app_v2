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
          '/checkin',
          '/auth/',
          '/demo/',
        ],
      },
    ],
    sitemap: 'https://island.kira-tabi.com/sitemap.xml',
  };
}
