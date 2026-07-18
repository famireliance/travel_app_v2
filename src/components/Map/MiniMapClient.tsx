'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import { Compass } from 'lucide-react';

const IslandMiniMap = dynamic(() => import('./IslandMiniMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 sm:h-80 rounded-2xl bg-slate-100/80 border border-slate-200 flex flex-col items-center justify-center text-slate-400 font-serif tracking-widest text-xs gap-3">
      <Compass className="w-6 h-6 animate-spin-slow opacity-50" strokeWidth={1} />
      <span>地図を読み込み中...</span>
    </div>
  )
});

interface MiniMapClientProps {
  coordinates?: string;
  name?: string;
}

export default function MiniMapClient(props: MiniMapClientProps) {
  return <IslandMiniMap {...props} />;
}
