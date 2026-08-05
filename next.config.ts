import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  // ESLint の any 型警告は段階的に修正予定。TypeScript は厳格モードを維持。
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default withPWA(nextConfig);
