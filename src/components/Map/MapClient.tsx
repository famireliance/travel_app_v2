import dynamic from 'next/dynamic';
import React from 'react';
import { Compass } from 'lucide-react';

const InteractiveMap = dynamic(() => import('./InteractiveMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[400px] bg-[#F8FAFC] flex flex-col items-center justify-center text-slate-400 font-serif tracking-[0.2em] text-sm gap-4">
      <Compass className="w-8 h-8 animate-spin-slow opacity-50" strokeWidth={1} />
      <span>地図を展開中...</span>
    </div>
  )
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function MapClient(props: any) {
  return <InteractiveMap {...props} />;
}
