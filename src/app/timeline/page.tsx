import type { Metadata } from 'next';
import TimelineClient from './TimelineClient';

export const metadata: Metadata = {
  title: 'みんなの島ノート',
  description: '全国の旅人たちが残した島の記録。リアルタイムで届く各地の島の息吹と絶景をお楽しみください。',
  alternates: { canonical: 'https://island.kira-tabi.com/timeline' },
  openGraph: {
    title: 'みんなの島ノート | 輝旅 島専科',
    description: '全国の旅人たちが残した島の記録。リアルタイムで届く各地の島の息吹と絶景をお楽しみください。',
    url: 'https://island.kira-tabi.com/timeline',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'みんなの島ノート | 輝旅 島専科',
    description: '全国の旅人たちが残した島の記録。リアルタイムで届く各地の島の息吹と絶景をお楽しみください。',
    images: ['/og-image.png'],
  },
};

export default function TimelinePage() {
  return <TimelineClient />;
}
