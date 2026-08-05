'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, MapPin, Users, Navigation, Star, ArrowRightLeft, CreditCard, Stethoscope, Store, Wifi, Sunrise, CheckSquare } from 'lucide-react';
import { ALL_ISLANDS_MASTER_DICTIONARY } from '@/data/allIslandsMaster';
import { supabase } from '@/lib/supabase';

interface IslandCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialSelected?: any;
}

export default function IslandCompareModal({ isOpen, onClose, initialSelected }: IslandCompareModalProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [islandA, setIslandA] = useState<any>(initialSelected || null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [islandB, setIslandB] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectingSlot, setSelectingSlot] = useState<'A' | 'B' | null>(initialSelected ? 'B' : 'A');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [searchResults, setSearchResults] = useState<any[]>([]);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSelectingSlot(null);
    } else {
      if (!islandA && !islandB) setSelectingSlot('A');
      else if (islandA && !islandB) setSelectingSlot('B');
      else if (!islandA && islandB) setSelectingSlot('A');
    }
  }, [isOpen, islandA, islandB]);

  useEffect(() => {
    if (searchQuery.length > 0) {
      const q = searchQuery.toLowerCase();
      const results = Object.values(ALL_ISLANDS_MASTER_DICTIONARY)
        .filter(i => i.name.toLowerCase().includes(q) || (i.prefecture && i.prefecture.includes(q)))
        .slice(0, 5);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  // Fetch full data including practical info when an island is selected
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSelectIsland = async (islandDef: any) => {
    setSearchQuery('');
    setSearchResults([]);
    
    // Fetch enriched data from Supabase
    const { data } = await supabase.from('islands').select('*').eq('id', islandDef.id).single();
    const enriched = data ? { ...islandDef, ...data } : islandDef;

    if (selectingSlot === 'A') {
      setIslandA(enriched);
      if (!islandB) setSelectingSlot('B');
      else setSelectingSlot(null);
    } else if (selectingSlot === 'B') {
      setIslandB(enriched);
      if (!islandA) setSelectingSlot('A');
      else setSelectingSlot(null);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }} 
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-5xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
            <h2 className="text-lg font-bold tracking-widest flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-indigo-400" />
              2島じまん比較バトル
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-6 bg-[#F8FAFC]">
            {/* Island A */}
            <div className="flex-1 flex flex-col gap-4">
              {!islandA || selectingSlot === 'A' ? (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-full flex flex-col">
                  <h3 className="text-sm font-bold text-slate-500 mb-4 tracking-widest text-center">比較する島 (A) を検索</h3>
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="島名や都道府県名で検索..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  {searchResults.length > 0 && selectingSlot === 'A' && (
                    <div className="flex-1 overflow-y-auto space-y-2">
                      {searchResults.map(result => (
                        <button
                          key={result.id}
                          onClick={() => handleSelectIsland(result)}
                          className="w-full text-left p-3 hover:bg-indigo-50 rounded-xl transition-colors border border-transparent hover:border-indigo-100 flex items-center gap-3"
                        >
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                            <MapPin className="w-4 h-4 text-indigo-500" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 text-sm">{result.name}</div>
                            <div className="text-xs text-slate-500">{result.prefecture}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
                  <button onClick={() => setSelectingSlot('A')} className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors z-10">
                    <ArrowRightLeft className="w-4 h-4 text-slate-600" />
                  </button>
                  <div className="bg-indigo-600 px-6 py-6 text-white text-center">
                    <div className="text-xs font-medium text-indigo-200 mb-1 tracking-widest">{islandA.prefecture}</div>
                    <h3 className="text-2xl font-bold font-serif">{islandA.name}</h3>
                  </div>
                  <IslandSpecs island={islandA} />
                </div>
              )}
            </div>

            {/* VS Divider */}
            <div className="hidden md:flex flex-col items-center justify-center shrink-0">
              <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-400 italic">VS</div>
            </div>

            {/* Island B */}
            <div className="flex-1 flex flex-col gap-4">
              {!islandB || selectingSlot === 'B' ? (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-full flex flex-col">
                  <h3 className="text-sm font-bold text-slate-500 mb-4 tracking-widest text-center">比較する島 (B) を検索</h3>
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="島名や都道府県名で検索..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  {searchResults.length > 0 && selectingSlot === 'B' && (
                    <div className="flex-1 overflow-y-auto space-y-2">
                      {searchResults.map(result => (
                        <button
                          key={result.id}
                          onClick={() => handleSelectIsland(result)}
                          className="w-full text-left p-3 hover:bg-emerald-50 rounded-xl transition-colors border border-transparent hover:border-emerald-100 flex items-center gap-3"
                        >
                          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                            <MapPin className="w-4 h-4 text-emerald-500" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 text-sm">{result.name}</div>
                            <div className="text-xs text-slate-500">{result.prefecture}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
                  <button onClick={() => setSelectingSlot('B')} className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors z-10">
                    <ArrowRightLeft className="w-4 h-4 text-slate-600" />
                  </button>
                  <div className="bg-emerald-600 px-6 py-6 text-white text-center">
                    <div className="text-xs font-medium text-emerald-200 mb-1 tracking-widest">{islandB.prefecture}</div>
                    <h3 className="text-2xl font-bold font-serif">{islandB.name}</h3>
                  </div>
                  <IslandSpecs island={islandB} />
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function IslandSpecs({ island }: { island: any }) {
  return (
    <div className="p-6">
      <div className="space-y-6">
        
        {/* Basic Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col items-center justify-center text-center">
            <Star className="w-4 h-4 text-amber-500 mb-1" />
            <span className="text-[10px] text-slate-500 mb-1">公式到達ポイント</span>
            <span className="text-base font-bold text-slate-800">{island.points || 0}pt</span>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col items-center justify-center text-center">
            <Users className="w-4 h-4 text-blue-500 mb-1" />
            <span className="text-[10px] text-slate-500 mb-1">人口</span>
            <span className="text-sm font-bold text-slate-800">{island.population || '不明'}</span>
          </div>
        </div>

        {/* Access */}
        <div>
          <h4 className="text-xs font-bold tracking-widest text-slate-400 mb-2 flex items-center gap-2">
            <Navigation className="w-3 h-3" /> アクセス難易度
          </h4>
          <p className="text-sm text-slate-700 leading-relaxed font-medium">{island.access}</p>
        </div>

        {/* Practical Info (Phase 1 Enriched) */}
        <div>
          <h4 className="text-xs font-bold tracking-widest text-slate-400 mb-3 flex items-center gap-2">
            <CheckSquare className="w-3 h-3" /> 実用・インフラ環境
          </h4>
          
          {island.is_uninhabited === true ? (
            <div className="bg-slate-100 text-slate-500 text-xs p-3 rounded-lg text-center font-medium">
              無人島のためインフラ設備なし
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 text-xs p-2 bg-slate-50 rounded-lg">
                <CreditCard className={`w-3.5 h-3.5 ${island.has_atm === true ? 'text-blue-500' : island.has_atm === false ? 'text-rose-400' : 'text-slate-300'}`} />
                <span className="text-slate-600 w-12">ATM等</span>
                <span className="font-bold text-slate-800">{island.has_atm === true ? 'あり' : island.has_atm === false ? 'なし' : '不明'}</span>
              </div>
              <div className="flex items-center gap-2 text-xs p-2 bg-slate-50 rounded-lg">
                <Stethoscope className={`w-3.5 h-3.5 ${island.has_clinic === true ? 'text-emerald-500' : island.has_clinic === false ? 'text-rose-400' : 'text-slate-300'}`} />
                <span className="text-slate-600 w-12">診療所</span>
                <span className="font-bold text-slate-800">{island.has_clinic === true ? 'あり' : island.has_clinic === false ? 'なし' : '不明'}</span>
              </div>
              <div className="flex items-center gap-2 text-xs p-2 bg-slate-50 rounded-lg">
                <Store className={`w-3.5 h-3.5 ${island.has_store === true ? 'text-amber-500' : island.has_store === false ? 'text-rose-400' : 'text-slate-300'}`} />
                <span className="text-slate-600 w-12">商店等</span>
                <span className="font-bold text-slate-800">{island.has_store === true ? 'あり' : island.has_store === false ? 'なし' : '不明'}</span>
              </div>
              <div className="flex items-center gap-2 text-xs p-2 bg-slate-50 rounded-lg">
                <Wifi className={`w-3.5 h-3.5 ${island.signal_status ? 'text-indigo-500' : 'text-slate-300'}`} />
                <span className="text-slate-600 w-12">電波</span>
                <span className="font-bold text-slate-800 truncate" title={island.signal_status || '不明'}>{island.signal_status || '不明'}</span>
              </div>
            </div>
          )}
        </div>
        
        {island.is_uninhabited !== true && (
          <div className="flex items-center gap-3 bg-orange-50/50 p-3 rounded-xl border border-orange-100">
            <Sunrise className="w-4 h-4 text-orange-500 shrink-0" />
            <div>
              <span className="text-[10px] text-orange-800 font-bold tracking-widest block mb-0.5">日帰り訪問</span>
              <span className={`text-xs font-bold ${island.day_trip === true ? 'text-emerald-600' : island.day_trip === false ? 'text-rose-600' : 'text-slate-500'}`}>
                {island.day_trip === true ? '可能' : island.day_trip === false ? '宿泊推奨' : '不明'}
              </span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
