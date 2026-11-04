import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
});

import redirectsList from './redirects.json';

const NOINDEX_HEADER = [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }];

const nextConfig: NextConfig = {
  // ESLint の any 型警告は段階的に修正予定。TypeScript は厳格モードを維持。
  eslint: {
    ignoreDuringBuilds: true,
  },
  async redirects() {
    return redirectsList;
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
        ],
      },
      { source: '/kira-system-panel-9f2/:path*', headers: NOINDEX_HEADER },
      { source: '/biz-portal-secure-8f92a1b3/:path*', headers: NOINDEX_HEADER },
      { source: '/demo/:path*', headers: NOINDEX_HEADER },
      { source: '/manual.html', headers: NOINDEX_HEADER },
      { source: '/operation-manual.html', headers: NOINDEX_HEADER },
      { source: '/checkin/:path*', headers: NOINDEX_HEADER },
      { source: '/order/:path*', headers: NOINDEX_HEADER },
      { source: '/mypage/:path*', headers: NOINDEX_HEADER },
    ];
  },
};

export default withPWA(nextConfig);
