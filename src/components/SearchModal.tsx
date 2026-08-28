import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, MapPin, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { fetchAllIslands } from '@/lib/supabase';
import { getIslandDifficulty } from '@/lib/difficulty';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectIsland?: (islandId: string) => void;
}

export default function SearchModal({ isOpen, onClose, onSelectIsland }: SearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [allIslands, setAllIslands] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<number | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setSelectedDifficulty(null);
      setResults([]);
    } else if (allIslands.length === 0) {
      setLoading(true);
      fetchAllIslands()
        .then(data => {
          setAllIslands(data || []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [isOpen, allIslands.length]);

  useEffect(() => {
    if (!query.trim() && selectedDifficulty === null) {
      setResults([]);
      return;
    }
    const q = query.toLowerCase();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filtered = allIslands.filter((i: any) => {
      const matchQuery = !q || (i.name && i.name.toLowerCase().includes(q)) || (i.prefecture && i.prefecture.toLowerCase().includes(q));
      const diff = getIslandDifficulty(i);
      const matchDiff = selectedDifficulty === null || diff.level === selectedDifficulty;
      return matchQuery && matchDiff;
    }).slice(0, 30);
    setResults(filtered);
  }, [query, selectedDifficulty, allIslands]);

  const difficulties = [
    { level: 1, label: '🌱 ★1 風の回廊島', color: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200' },
    { level: 2, label: '⛵ ★2 沿岸の旅島', color: 'bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200' },
    { level: 3, label: '🧭 ★3 本格冒険島', color: 'bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200' },
    { level: 4, label: '🌋 ★4 秘境フロンティア', color: 'bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200' },
    { level: 5, label: '👑 ★5 伝説の孤島', color: 'bg-rose-100 text-rose-700 hover:bg-rose-200 border-rose-200' },
    { level: 0, label: '🔒 渡航制限島（対象外）', color: 'bg-slate-800 text-amber-300 hover:bg-slate-900 border-slate-700' }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] bg-[#F8FAFC]/95 backdrop-blur-xl flex flex-col pt-20 px-6 font-sans h-[100dvh] w-screen"
        >
          <button 
            onClick={onClose}
            className="absolute top-8 right-6 lg:right-12 p-2 text-slate-400 hover:text-slate-800 transition-colors"
          >
            <X size={32} strokeWidth={1} />
          </button>

          <div className="w-full max-w-3xl mx-auto flex flex-col items-center h-full">
            <h2 className="text-sm font-bold tracking-[0.3em] uppercase text-slate-400 mb-6 shrink-0">Search Islands</h2>
            
            <div className="relative w-full mb-6 shrink-0">
              <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 text-slate-300" strokeWidth={1} />
              <input 
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="島名で探す..." 
                className="w-full bg-transparent border-b-2 border-slate-200 text-3xl lg:text-5xl font-serif text-slate-800 placeholder-slate-300 py-4 pl-12 focus:outline-none focus:border-blue-500 transition-colors"
                autoFocus
              />
            </div>

            <div className="w-full mb-8 shrink-0">
              <p className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">アクセス難易度フィルター</p>
              <div className="flex flex-wrap gap-2">
                {difficulties.map(d => (
                  <button
                    key={d.level}
                    onClick={() => setSelectedDifficulty(selectedDifficulty === d.level ? null : d.level)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                      selectedDifficulty === d.level 
                        ? d.color.replace('100', '500').replace('text-', 'text-white border-transparent')
                        : `bg-white border-slate-200 text-slate-600 hover:${d.color.split(' ')[0]}`
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 w-full overflow-y-auto pr-4 pb-24">
              {loading && <div className="text-center text-slate-400 tracking-widest text-sm">検索中...</div>}
              
              {!loading && results.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {results.map(island => {
                    const diff = getIslandDifficulty(island);
                    return (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={island.id}
                        onClick={() => {
                          onClose();
                          if (onSelectIsland) {
                            onSelectIsland(island.id);
                          } else {
                            router.push(`/island/${island.id}`);
                          }
                        }}
                        className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between cursor-pointer hover:border-blue-300 hover:shadow-md transition-all group"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-serif font-bold text-lg text-slate-800 group-hover:text-blue-600 transition-colors">{island.name}</h3>
                            <span className="text-[0.6rem] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Star size={10} className="text-amber-500" fill="currentColor" /> {diff.level}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 tracking-widest flex items-center gap-1">
                            <MapPin size={12} /> {island.prefecture}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {!loading && (query.length > 0 || selectedDifficulty !== null) && results.length === 0 && (
                <div className="text-center text-slate-400 font-serif mt-10">
                  条件に一致する島は見つかりませんでした。
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

