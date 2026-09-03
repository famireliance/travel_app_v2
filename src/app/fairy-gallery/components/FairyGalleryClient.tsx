'use client';

import { useState } from 'react';
import { FAIRIES_MASTER, IslandFairy, FairyRarity, FairyAttribute } from '@/lib/fairies';
import FairyCard from './FairyCard';
import { useTravel } from '@/context/TravelContext';
import Link from 'next/link';
import { Sparkles, Eye, Lock } from 'lucide-react';

interface FairyGalleryClientProps {
  discoveredImages?: string[];
}

export default function FairyGalleryClient({ discoveredImages = [] }: FairyGalleryClientProps) {
  const { collectedFairies, user } = useTravel();
  const [filterRarity, setFilterRarity] = useState<FairyRarity | 'ALL'>('ALL');
  const [filterAttribute, setFilterAttribute] = useState<FairyAttribute | 'ALL'>('ALL');
  const [previewAll, setPreviewAll] = useState(false);

  // filter fairies
  const filteredFairies = FAIRIES_MASTER.filter(fairy => {
    if (filterRarity !== 'ALL' && fairy.rarity !== filterRarity) return false;
    if (filterAttribute !== 'ALL' && fairy.attribute !== filterAttribute) return false;
    return true;
  });

  const discoveredCount = FAIRIES_MASTER.filter(fairy => collectedFairies.includes(fairy.id)).length;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold">ご当地妖精ずかん</h1>
            <button
              onClick={() => setPreviewAll(!previewAll)}
              className="text-xs px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:border-slate-500 transition flex items-center gap-1.5"
            >
              {previewAll ? <Lock className="w-3 h-3 text-amber-400" /> : <Eye className="w-3 h-3 text-blue-400" />}
              {previewAll ? 'マイ図鑑に戻す' : '全種プレビュー'}
            </button>
          </div>
          <p className="text-slate-400 text-sm">
            {previewAll ? (
              <span className="text-amber-300 font-medium">※ 全種類の妖精をプレビュー表示しています</span>
            ) : (
              <>
                全 {FAIRIES_MASTER.length} 種類中、<span className="text-blue-400 font-bold">{discoveredCount} 種類</span> を発見しました。
                {!user && <span className="ml-2 text-xs text-slate-500">（ログインすると獲得履歴が保存されます）</span>}
              </>
            )}
            <br/>
            <span className="text-slate-500 text-xs">カードにカーソルを合わせる（タップする）と詳細が確認できます。</span>
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
          const isRevealed = previewAll || collectedFairies.includes(fairy.id);
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
