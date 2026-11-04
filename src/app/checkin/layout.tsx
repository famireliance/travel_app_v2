import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'GPSスポットチェックイン',
  description: '輝旅 島専科（KIRATABI）の現地GPSチェックインページです。',
  robots: {
    index: false,
    follow: false,
  },
};

export default function CheckinLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
