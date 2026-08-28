'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Breadcrumb from '@/components/Breadcrumb';
import { 
  AFFILIATE_PRODUCTS, PACKING_CATEGORIES, DEFAULT_AMAZON_TAG, DEFAULT_RAKUTEN_ID,
  createAmazonSearchUrl, createRakutenSearchUrl, PackingCategoryType 
} from '@/data/affiliateProducts';
import { 
  ArrowLeft, CheckSquare, Square, ShoppingCart, Sparkles, 
  ShieldCheck, ExternalLink, RotateCcw, Compass, Plus, Trash2, Tag, AlertCircle, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export interface CustomPackingItem {
  id: string;
  name: string;
  isChecked: boolean;
  createdAt: number;
}

export default function PackingListPage() {
  const router = useRouter();
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Custom User Items
  const [customItems, setCustomItems] = useState<CustomPackingItem[]>([]);
  const [newItemName, setNewItemName] = useState<string>('');

  // Load state from localStorage
  useEffect(() => {
    try {
      const storedChecked = localStorage.getItem('kiratabi_packing_checked');
      if (storedChecked) {
        const parsed = JSON.parse(storedChecked);
        if (Array.isArray(parsed)) setCheckedIds(parsed);
      }

      const storedCustom = localStorage.getItem('kiratabi_packing_custom');
      if (storedCustom) {
        const parsedCustom = JSON.parse(storedCustom);
        if (Array.isArray(parsedCustom)) setCustomItems(parsedCustom);
      }
    } catch (e) {
      console.error('Failed to load packing list state', e);
    }
    setIsLoaded(true);
  }, []);

  // Save checked items
  const toggleCheck = (id: string) => {
    setCheckedIds(prev => {
      let next: string[];
      if (prev.includes(id)) {
        next = prev.filter(item => item !== id);
      } else {
        next = [...prev, id];
        toast.success('チェックリストを完了にしました！', { id: `check-${id}` });
      }
      localStorage.setItem('kiratabi_packing_checked', JSON.stringify(next));
      return next;
    });
  };

  // Add Custom Item
  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const newItem: CustomPackingItem = {
      id: `custom_${Date.now()}`,
      name: newItemName.trim(),
      isChecked: false,
      createdAt: Date.now(),
    };

    const nextCustom = [newItem, ...customItems];
    setCustomItems(nextCustom);
    localStorage.setItem('kiratabi_packing_custom', JSON.stringify(nextCustom));
    setNewItemName('');
    toast.success(`「${newItem.name}」を持ち物に追加しました！`);
  };

  // Toggle Custom Item Check
  const toggleCustomCheck = (id: string) => {
    const nextCustom = customItems.map(item => {
      if (item.id === id) return { ...item, isChecked: !item.isChecked };
      return item;
    });
    setCustomItems(nextCustom);
    localStorage.setItem('kiratabi_packing_custom', JSON.stringify(nextCustom));
  };

  // Delete Custom Item
  const handleDeleteCustomItem = (id: string) => {
    const nextCustom = customItems.filter(item => item.id !== id);
    setCustomItems(nextCustom);
    localStorage.setItem('kiratabi_packing_custom', JSON.stringify(nextCustom));
    toast('アイテムを削除しました', { icon: '🗑️' });
  };

  const handleSelectAll = () => {
    const allPresetIds = AFFILIATE_PRODUCTS.map(p => p.id);
    setCheckedIds(allPresetIds);
    localStorage.setItem('kiratabi_packing_checked', JSON.stringify(allPresetIds));

    // Also check custom items
    const allCustomChecked = customItems.map(item => ({ ...item, isChecked: true }));
    setCustomItems(allCustomChecked);
    localStorage.setItem('kiratabi_packing_custom', JSON.stringify(allCustomChecked));

    toast.success('すべてのアイテムを完了にしました！');
  };

  const handleClearAll = () => {
    setCheckedIds([]);
    localStorage.setItem('kiratabi_packing_checked', JSON.stringify([]));

    const allCustomUnchecked = customItems.map(item => ({ ...item, isChecked: false }));
    setCustomItems(allCustomUnchecked);
    localStorage.setItem('kiratabi_packing_custom', JSON.stringify(allCustomUnchecked));

    toast('チェックをリセットしました', { icon: '🔄' });
  };

  // Multi-category filtering
  const filteredProducts = AFFILIATE_PRODUCTS.filter(p => {
    if (activeCategory === 'all') return true;
    return p.categories.includes(activeCategory as PackingCategoryType);
  });

  const totalCount = AFFILIATE_PRODUCTS.length + customItems.length;
  const completedCount = checkedIds.length + customItems.filter(c => c.isChecked).length;
  const progressPercent = Math.round((completedCount / Math.max(totalCount, 1)) * 100);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="animate-spin text-blue-500"><Compass size={32} /></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] pb-36 font-sans text-slate-800 relative">
      
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

        {/* PR Affiliate & Tag Verification Badge (景品表示法 ＆ Amazon ID可視化) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-100 border border-slate-200 p-3 rounded-xl text-[0.7rem] text-slate-600">
          <div className="flex items-center gap-2">
            <AlertCircle size={14} className="text-slate-400 shrink-0" />
            <span>※当ページはアフィリエイト広告（Amazonアソシエイト・楽天アフィリエイト等）を利用しておすすめ商品をご紹介しています。</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto shrink-0">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-mono font-bold text-[0.65rem] border border-emerald-300">
              <Check size={12} className="text-emerald-600" />
              <span>Amazon ID: {DEFAULT_AMAZON_TAG} 紐付け済み</span>
            </div>
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono font-bold text-[0.65rem] border ${
              DEFAULT_RAKUTEN_ID 
                ? 'bg-rose-100 text-rose-800 border-rose-300' 
                : 'bg-slate-200 text-slate-600 border-slate-300'
            }`}>
              <Check size={12} className={DEFAULT_RAKUTEN_ID ? 'text-rose-600' : 'text-slate-400'} />
              <span>楽天 ID: {DEFAULT_RAKUTEN_ID ? DEFAULT_RAKUTEN_ID : '設定ファイルで設定可能'}</span>
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <div className="bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-950 p-8 rounded-3xl border border-amber-500/30 text-white relative overflow-hidden shadow-xl">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 mix-blend-overlay pointer-events-none" />
          
          <div className="relative z-10 space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold tracking-widest border border-amber-400/30">
              <Sparkles size={14} /> 島旅専門家監修 ＆ 完全カスタム対応
            </div>
            <h2 className="text-2xl md:text-4xl font-serif font-bold leading-tight">
              後悔しない島旅へ！<br />
              <span className="text-amber-400">絶対必要な持ち物 ＆ パッキングリスト</span>
            </h2>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed font-serif">
              「島の中に薬局がない」「カードが使えず現金不足」「民宿のコンセント不足やタオル無し」など、離島特有のトラブルを未然に防ぐ必須アイテムを網羅。自由にご自身の持ち物を追加してチェックリストとしてご利用いただけます！
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

        {/* Custom User Packing Input Form (自由追加機能) */}
        <div className="bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-slate-900/5 p-6 rounded-3xl border border-amber-500/30 space-y-4">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-amber-600" />
            <h3 className="font-serif font-bold text-slate-900 text-base">＋ 自分だけの持ち物をリストに追加する</h3>
          </div>
          
          <form onSubmit={handleAddCustomItem} className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="例：コンタクトレンズ洗浄液、自分のお気に入りのお菓子、持病の薬など..."
              className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 transition"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm rounded-2xl shadow-md flex items-center justify-center gap-2 shrink-0 transition-colors"
            >
              <Plus size={16} /> 追加する
            </button>
          </form>

          {/* Render User Custom Items */}
          {customItems.length > 0 && (
            <div className="pt-2 space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block">マイ追加リスト ({customItems.length}個)</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {customItems.map((cItem) => (
                  <div 
                    key={cItem.id}
                    className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                      cItem.isChecked ? 'bg-emerald-50/60 border-emerald-200' : 'bg-white border-slate-200'
                    }`}
                  >
                    <button
                      onClick={() => toggleCustomCheck(cItem.id)}
                      className="flex items-center gap-2.5 flex-1 text-left min-w-0"
                    >
                      {cItem.isChecked ? (
                        <CheckSquare className="w-5 h-5 text-emerald-600 shrink-0" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-300 shrink-0" />
                      )}
                      <span className={`text-sm font-bold truncate ${cItem.isChecked ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                        {cItem.name}
                      </span>
                    </button>

                    <div className="flex items-center gap-1 shrink-0">
                      <a
                        href={createAmazonSearchUrl(cItem.name)}
                        target="_blank"
                        rel="noopener noreferrer sponsored"
                        className="px-2 py-1 bg-[#FF9900] text-slate-950 text-[0.65rem] font-bold rounded-lg flex items-center gap-1 hover:opacity-90"
                        title="Amazonで探す"
                      >
                        Amazon <ExternalLink size={10} />
                      </a>
                      <button
                        onClick={() => handleDeleteCustomItem(cItem.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition-colors"
                        title="削除"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
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

                    {/* Right: Affiliate Action Buttons (or Non-Affiliate Notice for Cash) */}
                    {product.hasAffiliateLink ? (
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
                    ) : (
                      <div className="shrink-0 md:w-48 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100 flex items-center justify-center">
                        <span className="px-3 py-2 bg-slate-100 text-slate-500 rounded-xl text-xs font-bold border border-slate-200">
                          ※事前に現金を準備
                        </span>
                      </div>
                    )}

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
            離島では「現地で調達すればいい」が通用しない場面が多々あります。特に「薬」「現金」「充電器」「日焼け対策」「タオル類」の5点は事前準備が旅の成否を分けます。事前の準備を万全にして、最高の島旅をお楽しみください！
          </p>
        </div>

      </div>
    </main>
  );
}
