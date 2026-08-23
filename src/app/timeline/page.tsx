import type { Metadata } from 'next';
import TimelineClient from './TimelineClient';

export const metadata: Metadata = {
  title: 'みんなの島ノート | キラ旅',
  description: '全国の旅人たちが残した島の記録。リアルタイムで届く各地の島の息吹と絶景をお楽しみください。',
  openGraph: {
    title: 'みんなの島ノート | キラ旅',
    description: '全国の旅人たちが残した島の記録。リアルタイムで届く各地の島の息吹と絶景をお楽しみください。',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'みんなの島ノート | キラ旅',
    description: '全国の旅人たちが残した島の記録。リアルタイムで届く各地の島の息吹と絶景をお楽しみください。',
    images: ['/og-image.png'],
  },
};

export default function TimelinePage() {
  return <TimelineClient />;
}
