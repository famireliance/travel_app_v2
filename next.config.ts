import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ESLint の any 型警告は段階的に修正予定。TypeScript は厳格モードを維持。
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
