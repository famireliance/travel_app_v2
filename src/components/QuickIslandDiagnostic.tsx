'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Check, Lock, Map as MapIcon, Search, Sparkles, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { ALL_ISLANDS_MASTER_DICTIONARY } from '@/data/allIslandsMaster';
import { useTravel } from '@/context/TravelContext';
import ConquestMapShareModal, {
  CONQUEST_TARGET_ISLANDS,
  calculateIslandDeviation,
  getTravelerRank,
  isConquestIslandVisited,
} from '@/components/ConquestMapShareModal';

interface QuickIslandDiagnosticProps {
  onOpenAuth: () => void;
}

interface CuratedSpec {
  id: string;
  slug: string;
  shortLabel: string;
  areaHint: string;
}

const CURATED_24_SPECS: CuratedSpec[] = [
  { id: '386', slug: 'miyakojima', shortLabel: '宮古島', areaHint: '沖縄' },
  { id: '392', slug: 'ishigakijima', shortLabel: '石垣島', areaHint: '沖縄' },
  { id: '393', slug: 'taketomijima', shortLabel: '竹富島', areaHint: '沖縄' },
  { id: '396', slug: 'iriomotejima', shortLabel: '西表島', areaHint: '沖縄' },
  { id: '359', slug: 'yorontouyoronto', shortLabel: '与論島', areaHint: '鹿児島' },
  { id: '352', slug: 'amamioshima', shortLabel: '奄美大島', areaHint: '鹿児島' },
  { id: '340', slug: 'yakushima', shortLabel: '屋久島', areaHint: '鹿児島' },
  { id: '339', slug: 'tanegashima', shortLabel: '種子島', areaHint: '鹿児島' },
  { id: '264', slug: 'gotorettofukuejima', shortLabel: '福江島', areaHint: '五島・長崎' },
  { id: '258', slug: 'ikishima', shortLabel: '壱岐島', areaHint: '長崎' },
  { id: '252', slug: 'tsushimanagasakiken', shortLabel: '対馬', areaHint: '長崎' },
  { id: '146', slug: 'itsukushimamiyajima', shortLabel: '厳島（宮島）', areaHint: '広島' },
  { id: '195', slug: 'naoshima', shortLabel: '直島', areaHint: '香川' },
  { id: '197', slug: 'shodoshima', shortLabel: '小豆島', areaHint: '香川' },
  { id: '114', slug: 'awajishima', shortLabel: '淡路島', areaHint: '兵庫' },
  { id: '95', slug: 'himakajima', shortLabel: '日間賀島', areaHint: '愛知' },
  { id: '73', slug: 'enoshima', shortLabel: '江の島', areaHint: '神奈川' },
  { id: '87', slug: 'hatsushimashizuokakenatamishi', shortLabel: '初島', areaHint: '静岡' },
  { id: '49', slug: 'izuoshima', shortLabel: '伊豆大島', areaHint: '東京' },
  { id: '56', slug: 'hachijojima', shortLabel: '八丈島', areaHint: '東京' },
  { id: '63', slug: 'chichijimaogasawarashoto', shortLabel: '父島', areaHint: '小笠原' },
  { id: '76', slug: 'sadoto', shortLabel: '佐渡島', areaHint: '新潟' },
  { id: '190', slug: 'okinoshimagoshimanekenokinoshimamachi', shortLabel: '島後（隠岐）', areaHint: '島根' },
  { id: '2', slug: 'rishirito', shortLabel: '利尻島', areaHint: '北海道' },
];

const GUEST_DIAG_STORAGE_KEY = 'kiratabi_guest_diag_visited_v1';

function readGuestSavedIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(GUEST_DIAG_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function writeGuestSavedIds(ids: string[]) {
  if (typeof window === 'undefined') return;
  try {
    if (ids.length === 0) {
      localStorage.removeItem(GUEST_DIAG_STORAGE_KEY);
    } else {
      localStorage.setItem(GUEST_DIAG_STORAGE_KEY, JSON.stringify(Array.from(new Set(ids))));
    }
  } catch {
    // Ignore Safari Private Mode errors
  }
}

export default function QuickIslandDiagnostic({ onOpenAuth }: QuickIslandDiagnosticProps) {
  const { user, isAuthReady, isDataLoaded, islandStatuses, updateStatus } = useTravel();
  const [query, setQuery] = useState('');
  const [isShareOpen, setIsShareOpen] = useState(false);
  const hydratedRef = useRef(false);

  // Resolve curated 24 islands dynamically from ALL_ISLANDS_MASTER_DICTIONARY
  const curatedIslands = useMemo(() => {
    return CURATED_24_SPECS.map((spec) => {
      const direct = ALL_ISLANDS_MASTER_DICTIONARY[spec.id];
      const bySlug =
        direct ||
        CONQUEST_TARGET_ISLANDS.find(
          (i) => i.slug === spec.slug || String(i.name || '').startsWith(spec.shortLabel)
        );
      if (!bySlug) return null;
      return {
        island: bySlug,
        id: String(bySlug.id),
        shortLabel: spec.shortLabel,
        areaHint: spec.areaHint,
      };
    }).filter((x): x is NonNullable<typeof x> => Boolean(x));
  }, []);

  const curatedIdSet = useMemo(() => new Set(curatedIslands.map((c) => c.id)), [curatedIslands]);

  // Restore guest selections on reload OR hand off to account right after login
  useEffect(() => {
    if (!isAuthReady || !isDataLoaded || hydratedRef.current) return;
    const savedGuestIds = readGuestSavedIds();
    if (savedGuestIds.length === 0) {
      hydratedRef.current = true;
      return;
    }

    hydratedRef.current = true;
    let syncedCount = 0;
    savedGuestIds.forEach((id) => {
      if (!ALL_ISLANDS_MASTER_DICTIONARY[id]) return;
      const current = islandStatuses[id];
      if (current !== 'visited' && current !== 'verified_visited') {
        updateStatus(id, 'visited');
        syncedCount++;
      }
    });

    if (user) {
      writeGuestSavedIds([]);
      if (syncedCount > 0) {
        toast.success(`🎉 診断でチェックした ${syncedCount}島の到達記録をアカウントに永久保存しました！`);
      }
    }
  }, [isAuthReady, isDataLoaded, user, islandStatuses, updateStatus]);

  // Instant search results (up to 8 islands from all 417 conquest islands)
  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return CONQUEST_TARGET_ISLANDS.filter((isl) => {
      const name = String(isl.name || '').toLowerCase();
      const pref = String(isl.prefecture || '').toLowerCase();
      const slug = String(isl.slug || '').toLowerCase();
      return name.includes(q) || pref.includes(q) || slug.includes(q);
    }).slice(0, 8);
  }, [query]);

  // Extra visited islands outside the curated 24 (so user sees islands added via search)
  const extraVisitedIslands = useMemo(() => {
    return CONQUEST_TARGET_ISLANDS.filter(
      (isl) => !curatedIdSet.has(String(isl.id)) && isConquestIslandVisited(isl, islandStatuses)
    );
  }, [curatedIdSet, islandStatuses]);

  // Live stats across all 417 conquest islands
  const targetTotal = CONQUEST_TARGET_ISLANDS.length || 417;
  const visitedCount = useMemo(() => {
    return CONQUEST_TARGET_ISLANDS.filter((isl) => isConquestIslandVisited(isl, islandStatuses)).length;
  }, [islandStatuses]);
  const deviation = useMemo(() => calculateIslandDeviation(visitedCount), [visitedCount]);
  const rankInfo = useMemo(() => getTravelerRank(visitedCount), [visitedCount]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleToggleIsland = (island: any) => {
    const id = String(island.id);
    const currentStatus = islandStatuses[id];

    if (currentStatus === 'verified_visited') {
      toast('📍 現地GPS・写真で公式認証済みの島です！', { icon: '🏅' });
      return;
    }

    const isCurrentlyVisited = isConquestIslandVisited(island, islandStatuses);
    const nextStatus = isCurrentlyVisited ? 'none' : 'visited';
    updateStatus(id, nextStatus);

    if (!user) {
      const existing = readGuestSavedIds();
      if (nextStatus === 'visited') {
        writeGuestSavedIds([...existing, id]);
      } else {
        writeGuestSavedIds(existing.filter((x) => x !== id));
      }
    }
  };

  return (
    <section
      id="quick-diagnostic"
      className="px-4 sm:px-6 lg:px-12 pt-8 pb-6 bg-gradient-to-b from-slate-950 via-slate-900 to-[#F8FAFC]"
    >
      <div className="max-w-7xl mx-auto rounded-3xl bg-gradient-to-br from-slate-900 via-[#0B1930] to-slate-950 border border-amber-400/30 shadow-[0_20px_50px_rgba(2,6,23,0.45)] p-5 sm:p-7 lg:p-8 text-white relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-400/15 border border-amber-400/35 text-amber-300 text-[11px] font-bold tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>INSTANT ISLAND CHECK</span>
            </div>
            <h2 className="font-serif font-bold text-base sm:text-xl lg:text-2xl text-white leading-snug">
              🏝️ 30秒で診断！今まで行ったことがある日本の離島をタップしてみよう（登録不要）
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              タップするだけで全{targetTotal}島中の到達数・離島偏差値・あなた専用の日本全国制覇マップ画像を即時生成できます。
            </p>
          </div>
        </div>

        {/* Curated 24 Iconic Islands Grid */}
        <div className="relative z-10 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 sm:gap-2.5">
          {curatedIslands.map(({ island, id, shortLabel, areaHint }) => {
            const visited = isConquestIslandVisited(island, islandStatuses);
            return (
              <button
                key={id}
                type="button"
                onClick={() => handleToggleIsland(island)}
                className={`group relative px-2.5 py-2.5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between min-h-[60px] select-none ${
                  visited
                    ? 'bg-gradient-to-br from-amber-400/25 via-emerald-500/20 to-teal-500/25 border-amber-400 shadow-[0_0_16px_rgba(251,191,36,0.28)] scale-[1.01]'
                    : 'bg-slate-800/70 hover:bg-slate-800 border-slate-700/80 hover:border-slate-500'
                }`}
              >
                <div className="flex items-center justify-between gap-1 w-full">
                  <span className="text-[10px] font-medium text-slate-400 truncate">{areaHint}</span>
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                      visited
                        ? 'bg-amber-400 text-slate-950 shadow-sm'
                        : 'bg-slate-900/80 border border-slate-600 text-transparent group-hover:border-slate-400'
                    }`}
                  >
                    <Check className="w-2.5 h-2.5" strokeWidth={3} />
                  </span>
                </div>
                <span
                  className={`text-xs sm:text-[13px] font-bold mt-1 truncate w-full ${
                    visited ? 'text-amber-200' : 'text-slate-100'
                  }`}
                >
                  {shortLabel}
                </span>
              </button>
            );
          })}
        </div>

        {/* Quick Search Input for All 417 Islands */}
        <div className="relative z-10 mt-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`他の島を検索して追加（全${targetTotal}島）… 例: 波照間島、礼文島、座間味島、青ヶ島`}
              className="w-full bg-slate-950/80 border border-slate-700 focus:border-amber-400 rounded-2xl pl-10 pr-9 py-2.5 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none transition-colors"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                aria-label="検索クリア"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Up to 8 Instant Tap Search Pills */}
          {query.trim() !== '' && (
            <div className="mt-2.5 flex flex-wrap gap-2">
              {searchResults.length > 0 ? (
                searchResults.map((isl) => {
                  const visited = isConquestIslandVisited(isl, islandStatuses);
                  return (
                    <button
                      key={isl.id}
                      type="button"
                      onClick={() => handleToggleIsland(isl)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1.5 transition-all ${
                        visited
                          ? 'bg-amber-400/25 border-amber-400 text-amber-200'
                          : 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-slate-200'
                      }`}
                    >
                      <span>{visited ? '✓' : '＋'}</span>
                      <span>{isl.name}</span>
                      <span className="text-[10px] text-slate-400">({isl.prefecture})</span>
                    </button>
                  );
                })
              ) : (
                <span className="text-xs text-slate-400 px-2 py-1">
                  一致する制覇対象の島が見つかりませんでした
                </span>
              )}
            </div>
          )}

          {/* Extra Visited Islands Summary Pills */}
          {extraVisitedIslands.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-emerald-300 font-bold mr-1">
                その他の到達済 ({extraVisitedIslands.length}島):
              </span>
              {extraVisitedIslands.slice(0, 14).map((isl) => (
                <button
                  key={isl.id}
                  type="button"
                  onClick={() => handleToggleIsland(isl)}
                  className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-[11px] font-bold flex items-center gap-1 hover:bg-emerald-500/30 transition-colors"
                  title="タップで解除"
                >
                  <Check className="w-3 h-3 text-emerald-300" />
                  <span>{String(isl.name).replace(/（.*?）|\(.*?\)/g, '')}</span>
                </button>
              ))}
              {extraVisitedIslands.length > 14 && (
                <span className="text-[11px] text-slate-400 font-bold">
                  ほか+{extraVisitedIslands.length - 14}島
                </span>
              )}
            </div>
          )}
        </div>

        {/* Live Result Bar */}
        <div className="relative z-10 mt-5 pt-5 border-t border-slate-800 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm sm:text-base font-bold">
            <span className="text-slate-200">
              現在の到達島数:{' '}
              <strong className="text-amber-300 font-serif text-xl sm:text-2xl">
                {visitedCount}
              </strong>{' '}
              <span className="text-xs text-slate-400">/ {targetTotal}島</span>
            </span>
            <span className="text-slate-600 hidden sm:inline">｜</span>
            <span className="text-slate-200">
              推定離島偏差値:{' '}
              <strong className="text-cyan-300 font-serif text-xl sm:text-2xl">{deviation}</strong>
            </span>
            <span className="text-slate-600 hidden sm:inline">｜</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="text-slate-200">ランク:</span>
              <span
                className={`px-2.5 py-0.5 rounded-lg border text-sm font-extrabold ${rankInfo.badgeClass}`}
              >
                {rankInfo.rank}（{rankInfo.label}）
              </span>
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsShareOpen(true)}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-emerald-400 hover:from-amber-300 hover:to-emerald-300 text-slate-950 font-extrabold text-xs sm:text-sm shadow-lg flex items-center justify-center gap-2 transition-transform hover:scale-[1.02]"
            >
              <MapIcon className="w-4 h-4 shrink-0" />
              <span>🗺️ 私の離島制覇マップ画像を作る</span>
            </button>

            {!user ? (
              <button
                type="button"
                onClick={onOpenAuth}
                className="px-4 py-3 rounded-2xl bg-blue-600/90 hover:bg-blue-500 border border-blue-400/40 text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-1.5 transition-all"
              >
                <Lock className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span>🔐 無料ログインして記録＆公式到達証明書を永久保存</span>
              </button>
            ) : (
              <Link
                href="/mypage"
                className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-1.5 transition-all"
              >
                <span>🎖️ マイページで記録＆公式証明書を見る</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      <ConquestMapShareModal isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} />
    </section>
  );
}
