'use client';

import { useState } from 'react';
import { FAIRIES_MASTER, IslandFairy, FairyRarity, FairyAttribute } from '@/lib/fairies';
import FairyCard from './FairyCard';

interface FairyGalleryClientProps {
  discoveredImages: string[];
}

export default function FairyGalleryClient({ discoveredImages }: FairyGalleryClientProps) {
  const [filterRarity, setFilterRarity] = useState<FairyRarity | 'ALL'>('ALL');
  const [filterAttribute, setFilterAttribute] = useState<FairyAttribute | 'ALL'>('ALL');

  // filter fairies
  const filteredFairies = FAIRIES_MASTER.filter(fairy => {
    if (filterRarity !== 'ALL' && fairy.rarity !== filterRarity) return false;
    if (filterAttribute !== 'ALL' && fairy.attribute !== filterAttribute) return false;
    return true;
  });

  const discoveredCount = FAIRIES_MASTER.filter(fairy => 
    fairy.visual.imageUrl && discoveredImages.includes(fairy.visual.imageUrl.replace('/fairies/', ''))
  ).length;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">ご当地妖精ずかん</h1>
          <p className="text-slate-400">
            全 {FAIRIES_MASTER.length} 種類中、{discoveredCount} 種類を発見しました。<br/>
            <span className="text-slate-500 text-sm">カードにカーソルを合わせると詳細が表示されます。</span>
          </p>
        </div>
        
        {/* Filters */}
        <div className="flex flex-col gap-2">
          <div className="flex gap-2 text-sm overflow-x-auto pb-2 w-full max-w-[100vw]">
            <button onClick={() => setFilterRarity('ALL')} className={`px-3 py-1.5 rounded-full whitespace-nowrap ${filterRarity === 'ALL' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>すべて</button>
            <button onClick={() => setFilterRarity('NORMAL')} className={`px-3 py-1.5 rounded-full whitespace-nowrap ${filterRarity === 'NORMAL' ? 'bg-slate-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>NORMAL</button>
            <button onClick={() => setFilterRarity('RARE')} className={`px-3 py-1.5 rounded-full whitespace-nowrap ${filterRarity === 'RARE' ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>RARE</button>
            <button onClick={() => setFilterRarity('EPIC')} className={`px-3 py-1.5 rounded-full whitespace-nowrap ${filterRarity === 'EPIC' ? 'bg-yellow-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>EPIC</button>
            <button onClick={() => setFilterRarity('SPOT_EXCLUSIVE')} className={`px-3 py-1.5 rounded-full whitespace-nowrap ${filterRarity === 'SPOT_EXCLUSIVE' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>SPOT EXCLUSIVE</button>
          </div>
          
          <div className="flex gap-2 text-sm overflow-x-auto pb-2 w-full max-w-[100vw]">
            <button onClick={() => setFilterAttribute('ALL')} className={`px-3 py-1.5 rounded-full whitespace-nowrap ${filterAttribute === 'ALL' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>全属性</button>
            {['WATER', 'FIRE', 'NATURE', 'LIGHT', 'EARTH', 'WIND', 'ICE'].map(attr => (
              <button 
                key={attr} 
                onClick={() => setFilterAttribute(attr as FairyAttribute)} 
                className={`px-3 py-1.5 rounded-full whitespace-nowrap ${filterAttribute === attr ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
              >
                {attr}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 pb-20">
        {filteredFairies.map(fairy => {
          const imageFileName = fairy.visual.imageUrl?.replace('/fairies/', '');
          const isRevealed = !!(imageFileName && discoveredImages.includes(imageFileName));
          return <FairyCard key={fairy.id} fairy={fairy} isRevealed={isRevealed} />;
        })}
      </div>
      
      {filteredFairies.length === 0 && (
        <div className="w-full py-20 flex flex-col items-center justify-center text-slate-500">
          <span className="text-4xl mb-4">🔍</span>
          <p>条件に一致する妖精が見つかりません</p>
        </div>
      )}
    </div>
  );
}
