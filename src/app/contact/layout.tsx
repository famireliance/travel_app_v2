import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'お問い合わせ・自治体および宿泊事業者様のご相談窓口',
  description: '輝旅 島専科（KIRATABI SHIMASENKA）へのお問い合わせ、離島の宿泊施設掲載・自治体観光連携のご相談フォームです。',
  alternates: { canonical: 'https://island.kira-tabi.com/contact' },
  openGraph: {
    title: 'お問い合わせ・ご相談窓口 | 輝旅 島専科',
    description: '輝旅 島専科（KIRATABI SHIMASENKA）へのお問い合わせ、離島の宿泊施設掲載・自治体観光連携のご相談フォームです。',
    url: 'https://island.kira-tabi.com/contact',
    siteName: '輝旅 島専科（KIRATABI SHIMASENKA）',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'お問い合わせ・ご相談窓口 | 輝旅 島専科',
    description: '輝旅 島専科へのお問い合わせ、離島の宿泊施設掲載・自治体観光連携のご相談フォームです。',
    images: ['/og-image.png'],
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
