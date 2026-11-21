import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '認証処理中',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AuthCallbackLayout({ children }: { children: React.ReactNode }) {
  return children;
}
