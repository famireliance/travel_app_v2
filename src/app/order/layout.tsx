import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '到達証明書オーダー',
  description: '輝旅 島専科（KIRATABI）公認 到達証明書の郵送オーダー手続きページです。',
  robots: {
    index: false,
    follow: false,
  },
};

export default function OrderLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
