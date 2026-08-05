'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Sparkles, Send, MapPin, X, Loader2, ArrowRight, Star } from 'lucide-react';
import { useTravel } from '@/context/TravelContext';
import { ALL_ISLANDS_MASTER_DICTIONARY } from '@/data/allIslandsMaster';
import Link from 'next/link';

 
interface AiConciergeProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AiConcierge({ isOpen, onClose }: AiConciergeProps) {
  const { islandStatuses } = useTravel();
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [plans, setPlans] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const visitedIds = Object.entries(islandStatuses)
    .filter(([_, status]) => status === 'visited' || status === 'verified_visited')
    .map(([id]) => id);

  const handleSearch = async (e?: React.FormEvent, overrideInput?: string) => {
    if (e) e.preventDefault();
    const query = overrideInput !== undefined ? overrideInput : userInput;
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    setPlans(null);

    try {
      const res = await fetch('/api/ai-recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userInput: query,
          visitedIslandIds: visitedIds,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch recommendations');

      // Map AI returned IDs to real local DB objects to prevent hallucination
      const verifiedPlans = data.plans.map((p: any) => {
        const localData = ALL_ISLANDS_MASTER_DICTIONARY[p.id];
        if (localData) {
          return { ...p, ...localData };
        }
        return null;
      }).filter(Boolean); // Filter out any hallucinations

      setPlans(verifiedPlans);
    } catch (err: any) {
      setError(err.message || 'AIとの通信に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
          onClick={onClose}
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }} 
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-blue-500 text-white px-6 py-5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold tracking-widest flex items-center gap-2">
                  AI島旅コンシェルジュ
                  <Sparkles className="w-4 h-4 text-amber-300" />
                </h2>
                <p className="text-xs text-indigo-100 font-medium">あなただけの離島プランをご提案します</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 bg-slate-50 flex flex-col">
            
            {/* Input Form */}
            <form onSubmit={handleSearch} className="mb-8">
              <label className="block text-sm font-bold text-slate-700 mb-2">どんな島に行きたいですか？</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="例：海が綺麗で、日帰りできて、サウナがある島"
                  className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-4 pr-16 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm text-slate-800"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  disabled={isLoading}
                />
                <button 
                  type="submit"
                  disabled={isLoading || !userInput.trim()}
                  className="absolute right-2 top-2 bottom-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white w-12 rounded-xl flex items-center justify-center transition-colors"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="text-xs text-slate-500 font-medium">おまかせ検索：</span>
                {['週末に現実逃避できる島', '絶景で癒やされたい', 'アクティビティ充実', '行ったことない秘境'].map(preset => (
                  <button
                    key={preset}
                    type="button"
                    disabled={isLoading}
                    onClick={() => { setUserInput(preset); handleSearch(undefined, preset); }}
                    className="text-xs px-3 py-1 bg-white border border-slate-200 text-indigo-600 rounded-full hover:bg-indigo-50 transition-colors"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </form>

            {/* Error Message */}
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-600 p-4 rounded-xl mb-6 text-sm font-bold text-center">
                {error}
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="flex-1 flex flex-col items-center justify-center py-10 opacity-70">
                <div className="relative w-20 h-20 mb-6">
                  <div className="absolute inset-0 border-4 border-indigo-200 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                  <Bot className="absolute inset-0 m-auto w-8 h-8 text-indigo-600 animate-pulse" />
                </div>
                <p className="text-sm font-bold tracking-widest text-indigo-600 animate-pulse">432の島データから検索中...</p>
                <p className="text-xs text-slate-400 mt-2">（※到達済みの {visitedIds.length} 島を除外しています）</p>
              </div>
            )}

            {/* Results */}
            {!isLoading && plans && plans.length > 0 && (
              <div className="space-y-4 flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    AIが厳選した3つのプラン
                  </h3>
                  <button 
                    onClick={() => handleSearch()}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-lg"
                  >
                    再検索する
                  </button>
                </div>
                
                {plans.map((plan: any, idx: number) => (
                  <div key={idx} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-indigo-400 to-blue-500"></div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold tracking-widest text-white bg-indigo-600 px-2 py-0.5 rounded-md">
                          {plan.theme}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">{plan.prefecture}</span>
                      </div>
                      <h4 className="text-xl font-bold font-serif text-slate-900 flex items-center gap-2 mb-2">
                        {plan.name}
                        {plan.is_uninhabited && <span className="text-[10px] bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full">無人島</span>}
                      </h4>
                      <p className="text-sm text-slate-600 leading-relaxed font-medium mb-3">
                        {plan.reason}
                      </p>
                      <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-indigo-400" /> {plan.access}
                        </div>
                        {plan.points && (
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-amber-400" /> {plan.points}pt
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-end md:items-center justify-end shrink-0 md:pl-4 md:border-l border-slate-100">
                      <Link 
                        href={`/island/${plan.id}`}
                        onClick={onClose}
                        className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-600 transition-colors"
                      >
                        島を詳しく見る <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
