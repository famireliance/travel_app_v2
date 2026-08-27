import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'お問い合わせ',
  description: '輝旅 島専科（KIRATABI SHIMASENKA）に関するご質問・不具合報告・その他お問い合わせはこちらから受付しております。',
  alternates: { canonical: 'https://island.kira-tabi.com/contact' },
  openGraph: {
    title: 'お問い合わせ | 輝旅 島専科',
    description: '輝旅 島専科（KIRATABI SHIMASENKA）に関するご質問・不具合報告・その他お問い合わせはこちら。',
    url: 'https://island.kira-tabi.com/contact',
    images: ['/og-image.png'],
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
