'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Breadcrumb from '@/components/Breadcrumb';
import { AFFILIATE_PRODUCTS, PACKING_CATEGORIES, AffiliateProduct } from '@/data/affiliateProducts';
import { 
  ArrowLeft, CheckSquare, Square, ShoppingCart, Sparkles, 
  ShieldCheck, ExternalLink, RotateCcw, Award, Compass, Heart, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function PackingListPage() {
  const router = useRouter();
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Load checked items from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('kiratabi_packing_checked');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setCheckedIds(parsed);
        }
      }
    } catch (e) {
      console.error('Failed to load packing list state', e);
    }
    setIsLoaded(true);
  }, []);

  // Save checked items to localStorage
  const toggleCheck = (id: string) => {
    setCheckedIds(prev => {
      let next: string[];
      if (prev.includes(id)) {
        next = prev.filter(item => item !== id);
      } else {
        next = [...prev, id];
        toast.success('チェックリストに追加しました！', { id: `check-${id}` });
      }
      localStorage.setItem('kiratabi_packing_checked', JSON.stringify(next));
      return next;
    });
  };

  const handleSelectAll = () => {
    const allIds = AFFILIATE_PRODUCTS.map(p => p.id);
    setCheckedIds(allIds);
    localStorage.setItem('kiratabi_packing_checked', JSON.stringify(allIds));
    toast.success('すべてのアイテムを完了にしました！');
  };

  const handleClearAll = () => {
    setCheckedIds([]);
    localStorage.setItem('kiratabi_packing_checked', JSON.stringify([]));
    toast('チェックをリセットしました', { icon: '🔄' });
  };

  // Filter products by category
  const filteredProducts = AFFILIATE_PRODUCTS.filter(p => {
    if (activeCategory === 'all') return true;
    return p.category === activeCategory;
  });

  const totalCount = AFFILIATE_PRODUCTS.length;
  const completedCount = checkedIds.length;
  const progressPercent = Math.round((completedCount / Math.max(totalCount, 1)) * 100);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="animate-spin text-blue-500"><Compass size={32} /></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] pb-32 font-sans text-slate-800 relative">
      
      {/* Header */}
      <header className="px-6 lg:px-12 py-4 border-b border-slate-200/60 flex items-center justify-between sticky top-0 z-40 bg-white/80 backdrop-blur-md shadow-sm">
        <button 
          onClick={() => {
            if (typeof window !== 'undefined' && document.referrer && document.referrer.includes(window.location.host)) {
              router.back();
            } else {
              router.push('/');
            }
          }} 
          className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors"
          title="前のページに戻る"
        >
          <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
        </button>
        <h1 className="font-serif font-bold tracking-[0.2em] text-slate-900 flex items-center gap-2 text-base md:text-lg">
          <Compass className="text-amber-500 w-5 h-5" /> 島旅 持ち物 ＆ パッキングマスターガイド
        </h1>
        <div className="w-8" />
      </header>

      <div className="max-w-5xl mx-auto px-4 md:px-6 mt-6 space-y-6">
        <Breadcrumb items={[{ label: '島旅の持ち物 ＆ パッキングリスト' }]} className="mb-2" />

        {/* PR Affiliate Disclosure Notice (景品表示法・ステマ規制対応) */}
        <div className="bg-slate-100 border border-slate-200 p-3 rounded-xl text-[0.7rem] text-slate-500 flex items-center gap-2">
          <AlertCircle size={14} className="text-slate-400 shrink-0" />
          <span>※当ページはアフィリエイト広告（Amazonアソシエイト・楽天アフィリエイト等）を利用しておすすめ商品をご紹介しています。</span>
        </div>

        {/* Hero Section */}
        <div className="bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-950 p-8 rounded-3xl border border-amber-500/30 text-white relative overflow-hidden shadow-xl">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 mix-blend-overlay pointer-events-none" />
          
          <div className="relative z-10 space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold tracking-widest border border-amber-400/30">
              <Sparkles size={14} /> 島旅専門家監修
            </div>
            <h2 className="text-2xl md:text-4xl font-serif font-bold leading-tight">
              後悔しない島旅へ！<br />
              <span className="text-amber-400">絶対必要な持ち物 ＆ パッキングリスト</span>
            </h2>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed font-serif">
              「島の中に薬局がない」「カードが使えず現金不足」「強い日差しや船酔い」など、離島特有のトラブルを未然に防ぐ必須アイテムを厳選。パッキングチェックリストとしてもお使いいただけます！
            </p>
          </div>
        </div>

        {/* Interactive Progress Bar Card */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">PACKING PROGRESS</span>
              <h3 className="font-serif font-bold text-slate-900 text-lg flex items-center gap-2">
                パッキング達成度: <span className="text-blue-600 font-mono text-2xl">{completedCount}</span> / {totalCount} アイテム完了
              </h3>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={handleSelectAll}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                <CheckSquare size={14} /> すべてチェック
              </button>
              <button 
                onClick={handleClearAll}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw size={14} /> リセット
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5 }}
              className={`h-full rounded-full transition-all ${
                progressPercent >= 100 
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-500 shadow-[0_0_12px_rgba(245,158,11,0.5)]' 
                  : 'bg-gradient-to-r from-blue-500 to-indigo-600'
              }`}
            />
          </div>
          <p className="text-[0.7rem] text-slate-400 text-right font-mono">進捗率: {progressPercent}%</p>
        </div>

        {/* Category Tabs */}
        <div className="flex overflow-x-auto hide-scrollbar gap-2 py-2">
          {PACKING_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold tracking-wider transition-all whitespace-nowrap border ${
                activeCategory === cat.id
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Product Cards Grid */}
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((product) => {
              const isChecked = checkedIds.includes(product.id);

              return (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`p-6 rounded-3xl border transition-all ${
                    isChecked 
                      ? 'bg-emerald-50/40 border-emerald-300 shadow-sm' 
                      : 'bg-white border-slate-200 shadow-sm hover:shadow-md'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    
                    {/* Left: Checkbox & Info */}
                    <div className="flex items-start gap-4 flex-1">
                      <button
                        onClick={() => toggleCheck(product.id)}
                        className={`mt-1 shrink-0 p-1 rounded-xl transition-all ${
                          isChecked ? 'text-emerald-600 hover:text-emerald-700' : 'text-slate-300 hover:text-slate-500'
                        }`}
                      >
                        {isChecked ? (
                          <CheckSquare className="w-8 h-8 fill-emerald-100" strokeWidth={2} />
                        ) : (
                          <Square className="w-8 h-8" strokeWidth={1.5} />
                        )}
                      </button>

                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-2xl">{product.icon}</span>
                          <h3 className={`font-serif font-bold text-lg md:text-xl ${isChecked ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                            {product.name}
                          </h3>
                          {product.isMustHave && (
                            <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-[0.65rem] font-extrabold tracking-wider uppercase shadow-sm">
                              最重要必需品
                            </span>
                          )}
                        </div>

                        <p className="text-xs font-bold text-amber-600 bg-amber-50 inline-block px-2.5 py-1 rounded-lg border border-amber-200">
                          💡 {product.subtitle}
                        </p>

                        <p className="text-xs md:text-sm text-slate-600 leading-relaxed font-serif">
                          {product.description}
                        </p>

                        <p className="text-[0.7rem] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200 leading-normal">
                          <span className="font-bold text-blue-600">なぜ必要？: </span>{product.recommendReason}
                        </p>
                      </div>
                    </div>

                    {/* Right: Affiliate Action Buttons */}
                    <div className="shrink-0 flex flex-col sm:flex-row md:flex-col gap-2.5 md:w-48 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
                      <a
                        href={product.amazonUrl}
                        target="_blank"
                        rel="noopener noreferrer sponsored"
                        className="w-full py-2.5 px-4 rounded-xl bg-[#FF9900] hover:bg-[#e68a00] text-slate-950 font-bold text-xs tracking-wider flex items-center justify-center gap-2 shadow-md transition-all hover:scale-102"
                      >
                        <ShoppingCart size={14} />
                        Amazonで探す
                        <ExternalLink size={12} className="opacity-70" />
                      </a>

                      <a
                        href={product.rakutenUrl}
                        target="_blank"
                        rel="noopener noreferrer sponsored"
                        className="w-full py-2.5 px-4 rounded-xl bg-[#BF0000] hover:bg-[#a60000] text-white font-bold text-xs tracking-wider flex items-center justify-center gap-2 shadow-md transition-all hover:scale-102"
                      >
                        <ShoppingCart size={14} />
                        楽天市場で探す
                        <ExternalLink size={12} className="opacity-70" />
                      </a>
                    </div>

                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Bottom Banner & Tip */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-3xl border border-blue-100 space-y-3 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 text-blue-700 font-bold text-sm">
            <ShieldCheck size={18} />
            <span>島旅パッキングの極意</span>
          </div>
          <h4 className="font-serif font-bold text-slate-900 text-lg">「迷ったら持っていく」のが離島旅の鉄則！</h4>
          <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
            離島では「現地で調達すればいい」が通用しない場面が多々あります。特に「薬」「現金」「充電器」「日焼け対策」の4点は事前準備が旅の成否を分けます。事前の準備を万全にして、最高の島旅をお楽しみください！
          </p>
        </div>

      </div>
    </main>
  );
}
