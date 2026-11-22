'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Map, Calendar, Ship, ArrowLeft, ArrowRight, Loader2, Compass, RefreshCw, BedDouble, Car, Crown, ShoppingBag } from 'lucide-react';
import Breadcrumb from '@/components/Breadcrumb';
import { useTravel } from '@/context/TravelContext';
import { supabase } from '@/lib/supabase';
import { ALL_ISLANDS_MASTER_DICTIONARY } from '@/data/allIslandsMaster';
import { getRakutenTravelSearchUrl, getJalanSearchUrl } from '@/data/islandFacilitiesData';

interface RoutePlan {
  planType: string;
  title: string;
  description: string;
  totalEstimatedBudget: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  islandGuides?: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  gearPicks?: any[];
  route: {
    day: number;
    islandId: string;
    slug?: string;
    islandName: string;
    prefecture?: string;
    activity: string;
    transportation: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    conciergeGuide?: any;
  }[];
}

export default function RoutePlannerPage() {
  const router = useRouter();
  const { islandStatuses } = useTravel();
  const [startLocation, setStartLocation] = useState('東京');
  const [durationDays, setDurationDays] = useState(3);
  const [preferences, setPreferences] = useState('');
  const [maxIslands] = useState(3);
  const [excludeVisited, setExcludeVisited] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<RoutePlan[] | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  const handleGenerate = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      let excludedIslands: string[] = [];
      if (excludeVisited && islandStatuses) {
        excludedIslands = Object.keys(islandStatuses).filter(
          id => islandStatuses[id] === 'visited' || islandStatuses[id] === 'verified_visited'
        );
      }

      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/ai-route', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          startLocation,
          durationDays,
          preferences,
          maxIslands,
          excludedIslands
        })
      });

      const rawText = await res.text();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let data: any;
      try {
        data = JSON.parse(rawText);
      } catch {
        throw new Error('現在AIコンシェルジュへのアクセスが集中しています。数秒おいてもう一度お試しください。');
      }

      if (!res.ok) {
        throw new Error(data?.error || 'ルートの作成に失敗しました。もう一度お試しください。');
      }

      const normalizedPlans = Array.isArray(data)
        ? data
        : Array.isArray(data?.plans)
        ? data.plans
        : [];
      if (normalizedPlans.length === 0) {
        throw new Error('ルートプランを生成できませんでした。条件を変更して再度お試しください。');
      }
      setResult(normalizedPlans);
      setActiveTab(0);
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) {
        setErrorMsg(err.message || 'エラーが発生しました。APIキーが設定されていない可能性があります。');
      } else {
        setErrorMsg('エラーが発生しました。APIキーが設定されていない可能性があります。');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans">
      <header className="bg-slate-900 text-white px-6 pt-12 pb-6 sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-4 max-w-3xl mx-auto">
          <button 
            onClick={() => {
              if (typeof window !== 'undefined' && document.referrer && document.referrer.includes(window.location.host)) {
                router.back();
              } else {
                router.push('/');
              }
            }}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
            title="前のページに戻る"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-serif text-xl md:text-2xl font-bold tracking-widest flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-amber-400" />
              AI 島巡りコンシェルジュ
            </h1>
            <p className="text-xs text-white/60 mt-1">最新AIがあなただけのアイランドホッピングを提案します</p>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-6">
        <Breadcrumb items={[{ label: 'ルートプランナー' }]} className="mb-6" />

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                <Map size={14} />
                出発地・拠点
              </label>
              <input 
                type="text" 
                value={startLocation}
                onChange={(e) => setStartLocation(e.target.value)}
                placeholder="例: 東京、那覇、石垣島..." 
                className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 font-medium"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                <Calendar size={14} />
                日数
              </label>
              <select 
                value={durationDays}
                onChange={(e) => setDurationDays(Number(e.target.value))}
                className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 font-medium appearance-none bg-white"
              >
                {[1, 2, 3, 4, 5, 7, 10].map(d => (
                  <option key={d} value={d}>{d} 日間</option>
                ))}
              </select>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                <Sparkles size={14} />
                旅のテーマ・希望
              </label>
              <textarea 
                value={preferences}
                onChange={(e) => setPreferences(e.target.value)}
                placeholder="例: 絶景ビーチでのんびりしたい、美味しい海鮮が食べたい、シュノーケリング..." 
                className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 font-medium min-h-[100px]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center gap-3 cursor-pointer p-4 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors">
                <input 
                  type="checkbox" 
                  checked={excludeVisited}
                  onChange={(e) => setExcludeVisited(e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span className="text-sm font-bold text-slate-700">
                  すでに行ったことのある島（到達済み）はルートから除外する
                </span>
              </label>
            </div>
          </div>

          <button 
            onClick={handleGenerate}
            disabled={isLoading}
            className={`w-full py-4 rounded-xl font-bold tracking-widest text-white shadow-lg flex items-center justify-center gap-2 transition-all ${
              isLoading ? 'bg-slate-400 cursor-wait' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:scale-[1.02]'
            }`}
          >
            {isLoading ? (
              <><Loader2 className="animate-spin" size={20} /> AIがルートを考案中...</>
            ) : (
              <><Sparkles size={20} /> 最適なルートを生成する</>
            )}
          </button>
          
          {errorMsg && (
            <div className="mt-4 p-4 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-200">
              {errorMsg}
            </div>
          )}
        </div>

        {/* AI Result Section (Tabs for Multiple Plans) */}
        {Array.isArray(result) && result.length > 0 && !isLoading && (
          <div className="animate-fade-in-up">
            <h2 className="font-serif text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Compass className="w-6 h-6 text-blue-500" /> 
              提案されたプラン
            </h2>
            
            {/* Tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
              {result.map((plan, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTab(index)}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-all border ${
                    activeTab === index 
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                      : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {plan.planType || `プラン ${index + 1}`}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 mb-8">
              <h3 className="font-serif text-xl md:text-2xl font-bold text-slate-800 mb-2">{result?.[activeTab]?.title}</h3>
              <p className="text-slate-600 leading-relaxed mb-4">{result?.[activeTab]?.description}</p>
              <p className="text-sm font-bold text-amber-600 mb-8 bg-amber-50 inline-block px-3 py-1 rounded-full border border-amber-200">
                💰 目安予算: {result?.[activeTab]?.totalEstimatedBudget || '—'}
              </p>

              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-blue-200 before:to-transparent">
                {(Array.isArray(result?.[activeTab]?.route) ? result[activeTab].route : []).map((day, index) => {
                  const targetSlugOrId =
                    day?.slug ||
                    (day?.islandId && ALL_ISLANDS_MASTER_DICTIONARY[String(day.islandId)]?.slug) ||
                    day?.islandId;
                  return (
                  <div key={index} className="relative flex items-start justify-between md:justify-normal md:odd:flex-row-reverse group">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-blue-500 text-white font-bold shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-md z-10">
                      {day?.day}
                    </div>
                    
                    <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] bg-white p-5 rounded-2xl shadow-sm border border-slate-100 mb-2">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                          {day?.islandName}
                        </h4>
                        {targetSlugOrId && (
                          <button 
                            onClick={() => router.push(`/island/${targetSlugOrId}`)}
                            className="text-[0.65rem] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full hover:bg-blue-100 flex items-center gap-1 transition-colors"
                          >
                            詳細 <ArrowRight size={10} />
                          </button>
                        )}
                      </div>
                      
                        <p className="text-sm text-slate-600 leading-relaxed mb-4">
                          {day?.activity || (day as any)?.description}
                        </p>
                        
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-start gap-2 text-xs font-medium text-slate-500 mb-3">
                          <Ship size={14} className="text-blue-400 mt-0.5 shrink-0" />
                          <span>{day?.transportation}</span>
                        </div>

                        {day?.islandName && (
                          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                            <span className="text-[10px] font-bold text-slate-400 px-1.5 py-0.5 bg-slate-100 rounded">PR</span>
                            <a
                              href={getRakutenTravelSearchUrl(
                                day.islandName,
                                (day as any)?.prefecture ||
                                  (day.islandId && ALL_ISLANDS_MASTER_DICTIONARY[String(day.islandId)]?.prefecture) ||
                                  undefined
                              )}
                              target="_blank"
                              rel="noopener noreferrer sponsored"
                              className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors"
                            >
                              楽天トラベルで宿を見る
                            </a>
                            <a
                              href={getJalanSearchUrl(
                                day.islandName,
                                (day as any)?.prefecture ||
                                  (day.islandId && ALL_ISLANDS_MASTER_DICTIONARY[String(day.islandId)]?.prefecture) ||
                                  undefined
                              )}
                              target="_blank"
                              rel="noopener noreferrer sponsored"
                              className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors"
                            >
                              じゃらんで宿を比較
                            </a>
                          </div>
                        )}
                    </div>
                  </div>
                  );
                })}
              </div>

              {/* コンシェルジュ厳選：宿・レンタカー・公認加盟店・準備アイテム手配ガイド */}
              {(Array.isArray(result?.[activeTab]?.islandGuides) && result[activeTab].islandGuides.length > 0) && (
                <div className="mt-8 pt-7 border-t border-slate-200 space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="font-serif font-bold text-base md:text-lg text-slate-900 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-500" />
                      コンシェルジュ厳選：おすすめの宿・島内移動・現地手配
                    </h4>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                      PR・プロモーションを含みます
                    </span>
                  </div>

                  <div className="space-y-4">
                    {result[activeTab].islandGuides.map((guide: any) => (
                      <div
                        key={guide.islandId}
                        className="rounded-2xl bg-slate-50/90 border border-slate-200 p-4 md:p-5 space-y-4"
                      >
                        <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                          <span className="font-bold text-sm md:text-base text-slate-900">
                            🏝️ {guide.islandName}（{guide.prefecture}）の手配アドバイス
                          </span>
                        </div>

                        {/* 1. 公認加盟店・提携宿（登録されている場合のみ最優先表示） */}
                        {Array.isArray(guide.partners) && guide.partners.length > 0 && (
                          <div className="space-y-2">
                            {guide.partners.map((pt: any) => (
                              <div
                                key={pt.id}
                                className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300/80 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                              >
                                <div className="space-y-1">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white">
                                      <Crown size={10} /> {pt.badge}
                                    </span>
                                    <span className="text-[11px] text-amber-800 font-medium">{pt.category}</span>
                                  </div>
                                  <p className="font-bold text-sm text-slate-900">{pt.name}</p>
                                  {(pt.perkText || pt.priceRange) && (
                                    <p className="text-xs text-amber-900">
                                      {pt.perkText ? `🎁 ${pt.perkText}` : ''}
                                      {pt.perkText && pt.priceRange ? ' ／ ' : ''}
                                      {pt.priceRange || ''}
                                    </p>
                                  )}
                                </div>
                                {pt.isInternal ? (
                                  <button
                                    type="button"
                                    onClick={() => router.push(pt.url)}
                                    className="shrink-0 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-blue-700 text-white text-xs font-bold transition-colors"
                                  >
                                    詳細・予約へ →
                                  </button>
                                ) : (
                                  <a
                                    href={pt.url}
                                    target="_blank"
                                    rel="noopener noreferrer sponsored"
                                    className="shrink-0 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-blue-700 text-white text-xs font-bold transition-colors text-center"
                                  >
                                    公式サイトを見る →
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* 2. おすすめ宿エリア＆予約リンク */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                          <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 flex flex-col justify-between gap-3">
                            <div>
                              <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
                                <BedDouble size={14} className="text-rose-500" />
                                おすすめの宿・滞在エリア
                              </p>
                              <p className="text-xs text-slate-600 leading-relaxed">
                                {guide.stayTip}
                              </p>
                              {Array.isArray(guide.localStayNames) && guide.localStayNames.length > 0 && (
                                <p className="text-[11px] text-slate-500 mt-1.5">
                                  実在宿例：{guide.localStayNames.join(' / ')}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {(guide.stayLinks || []).map((lnk: any, lIdx: number) => (
                                <a
                                  key={lIdx}
                                  href={lnk.url}
                                  target="_blank"
                                  rel="noopener noreferrer sponsored"
                                  className={`text-[11px] font-bold px-2.5 py-1.5 rounded-lg border transition-colors ${
                                    lnk.provider === 'rakuten'
                                      ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-600'
                                      : lnk.provider === 'jalan'
                                        ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                                        : 'bg-blue-50 hover:bg-blue-100 text-blue-800 border-blue-200'
                                  }`}
                                >
                                  {lnk.label}
                                </a>
                              ))}
                            </div>
                          </div>

                          {/* 3. おすすめ島内移動・レンタカー手配 */}
                          <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 flex flex-col justify-between gap-3">
                            <div>
                              <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
                                <Car size={14} className="text-blue-600" />
                                おすすめの島内移動・レンタカー
                              </p>
                              <p className="text-xs text-slate-600 leading-relaxed">
                                {guide.mobilityTip}
                              </p>
                              {Array.isArray(guide.localTransportNames) && guide.localTransportNames.length > 0 && (
                                <p className="text-[11px] text-slate-500 mt-1.5">
                                  現地交通例：{guide.localTransportNames.join(' / ')}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {(guide.mobilityLinks || []).map((lnk: any, lIdx: number) => (
                                <a
                                  key={lIdx}
                                  href={lnk.url}
                                  target="_blank"
                                  rel="noopener noreferrer sponsored"
                                  className={`text-[11px] font-bold px-2.5 py-1.5 rounded-lg border transition-colors ${
                                    lnk.provider === 'rakuten'
                                      ? 'bg-blue-600 hover:bg-blue-500 text-white border-blue-600'
                                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                                  }`}
                                >
                                  {lnk.label}
                                </a>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 4. プラン連動おすすめ持ち物（物販アフィリエイト） */}
                  {Array.isArray(result?.[activeTab]?.gearPicks) && result[activeTab].gearPicks.length > 0 && (
                    <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                          <ShoppingBag size={14} className="text-indigo-600" />
                          このルートにあると安心な離島旅アイテム
                        </p>
                        <div className="flex flex-wrap gap-3 pt-1">
                          {result[activeTab].gearPicks.map((g: any, gIdx: number) => (
                            <div key={gIdx} className="flex flex-wrap items-center gap-1.5 text-xs text-slate-700">
                              <span className="font-bold">{g.icon} {g.name}：</span>
                              {g.rakutenUrl && (
                                <a
                                  href={g.rakutenUrl}
                                  target="_blank"
                                  rel="noopener noreferrer sponsored"
                                  className="text-[11px] font-bold text-rose-700 underline hover:text-rose-900"
                                >
                                  楽天で見る
                                </a>
                              )}
                              {g.amazonUrl && (
                                <a
                                  href={g.amazonUrl}
                                  target="_blank"
                                  rel="noopener noreferrer sponsored"
                                  className="text-[11px] font-bold text-amber-800 underline hover:text-amber-950"
                                >
                                  Amazonで見る
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Regenerate Button */}
            <div className="text-center">
              <p className="text-xs text-slate-500 mb-3">気に入るプランが見つからない場合は再生成できます</p>
              <button 
                onClick={handleGenerate}
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-slate-700 bg-white border-2 border-slate-200 shadow-sm hover:border-slate-300 hover:bg-slate-50 transition-all active:scale-95"
              >
                <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
                {isLoading ? "考案中..." : "別のルートを再検索する"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

