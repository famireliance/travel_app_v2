import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'システム管理パネル',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminSystemLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
