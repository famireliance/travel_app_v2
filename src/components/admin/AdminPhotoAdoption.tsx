'use client';

import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Camera,
  CheckCircle,
  Sparkles,
  Search,
  RefreshCw,
  ExternalLink,
  Award,
  Ticket,
  AlertCircle,
} from 'lucide-react';

interface CandidateDiaryPhoto {
  id: string;
  island_id: string;
  raw_island_id: string;
  island_name: string;
  prefecture: string;
  photo_url: string;
  content: string;
  created_at: string;
  is_hidden: boolean;
  author_user_id: string;
  author_nickname: string | null;
  author_adopted_count: number;
  needsOfficialPhoto: boolean;
  isAdopted: boolean;
  currentOfficialPhotoUrl: string | null;
}

export default function AdminPhotoAdoption({ password }: { password: string }) {
  const [diaries, setDiaries] = useState<CandidateDiaryPhoto[]>([]);
  const [missingPhotoIslandsCount, setMissingPhotoIslandsCount] = useState<number>(178);
  const [adoptedTotalCount, setAdoptedTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [adoptingId, setAdoptingId] = useState<string | null>(null);

  // Filters
  const [prioritizeMissingPhoto, setPrioritizeMissingPhoto] = useState<boolean>(true);
  const [onlyMissingFilter, setOnlyMissingFilter] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/adopt-photo', {
        headers: { 'x-admin-password': password },
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || '投稿写真データの取得に失敗しました');
        return;
      }
      setDiaries(Array.isArray(data.diaries) ? data.diaries : []);
      if (typeof data.missingPhotoIslandsCount === 'number' && data.missingPhotoIslandsCount > 0) {
        setMissingPhotoIslandsCount(data.missingPhotoIslandsCount);
      }
      if (typeof data.adoptedCount === 'number') {
        setAdoptedTotalCount(data.adoptedCount);
      }
    } catch {
      toast.error('投稿写真データの取得中に通信エラーが発生しました');
    } finally {
      setLoading(false);
    }
  }, [password]);

  useEffect(() => {
    void fetchCandidates();
  }, [fetchCandidates]);

  const handleAdoptPhoto = async (item: CandidateDiaryPhoto) => {
    const confirmMsg = item.isAdopted
      ? `「${item.island_name}」の公式島写真としてこの投稿写真を再適用しますか？（既に採用済みのため重複チケット付与は行われません）`
      : `「${item.island_name}」の公式島写真に採用し、投稿者へ高画質証明書チケット1枚＋公認フォトグラファー実績を進呈しますか？`;
    if (!window.confirm(confirmMsg)) return;

    setAdoptingId(item.id);
    try {
      const res = await fetch('/api/admin/adopt-photo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
        body: JSON.stringify({
          diaryId: item.id,
          islandId: item.island_id,
          photoUrl: item.photo_url,
          authorUserId: item.author_user_id,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '採用処理に失敗しました');
      }
      toast.success(data.message || '公式写真に採用しました！');
      await fetchCandidates();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '採用処理に失敗しました';
      toast.error(msg);
    } finally {
      setAdoptingId(null);
    }
  };

  const displayedDiaries = [...diaries]
    .filter((d) => {
      if (d.is_hidden) return false;
      if (onlyMissingFilter && !d.needsOfficialPhoto) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = d.island_name.toLowerCase().includes(q);
        const matchId = d.island_id.toLowerCase().includes(q) || d.raw_island_id.toLowerCase().includes(q);
        const matchPref = d.prefecture.toLowerCase().includes(q);
        const matchContent = d.content.toLowerCase().includes(q);
        if (!matchName && !matchId && !matchPref && !matchContent) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (prioritizeMissingPhoto) {
        if (a.needsOfficialPhoto !== b.needsOfficialPhoto) {
          return a.needsOfficialPhoto ? -1 : 1;
        }
        if (a.isAdopted !== b.isAdopted) {
          return a.isAdopted ? 1 : -1;
        }
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const unverifiedCandidateCount = diaries.filter((d) => !d.is_hidden && d.needsOfficialPhoto).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Camera className="w-6 h-6 text-amber-400" />
            投稿写真の公式採用 ＆ 公認フォトグラファー認定
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            旅人の島日記写真をワンクリックで公式島写真（hero_image_url）に採用し、高画質証明書チケット＋1枚と公認フォトグラファー実績を自動付与します
          </p>
        </div>
        <button
          type="button"
          onClick={() => void fetchCandidates()}
          disabled={loading}
          className="bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold text-xs px-4 py-2.5 rounded-xl border border-gray-700 transition flex items-center gap-1.5 shrink-0 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 text-amber-400 ${loading ? 'animate-spin' : ''}`} />
          最新の投稿を再読み込み
        </button>
      </div>

      {/* Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-amber-500/30 rounded-2xl p-4">
          <p className="text-[11px] font-bold text-amber-400">公式写真が未登録の島</p>
          <p className="text-2xl font-black text-white mt-1">
            {missingPhotoIslandsCount} <span className="text-xs font-normal text-gray-400">島</span>
          </p>
        </div>
        <div className="bg-gray-900 border border-sky-500/30 rounded-2xl p-4">
          <p className="text-[11px] font-bold text-sky-400">写真未登録島への投稿候補</p>
          <p className="text-2xl font-black text-white mt-1">
            {unverifiedCandidateCount} <span className="text-xs font-normal text-gray-400">件</span>
          </p>
        </div>
        <div className="bg-gray-900 border border-emerald-500/30 rounded-2xl p-4">
          <p className="text-[11px] font-bold text-emerald-400">累計公式採用済み写真</p>
          <p className="text-2xl font-black text-white mt-1">
            {adoptedTotalCount} <span className="text-xs font-normal text-gray-400">枚</span>
          </p>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 cursor-pointer bg-amber-950/50 border border-amber-500/40 px-3.5 py-2 rounded-xl text-xs font-bold text-amber-200">
            <input
              type="checkbox"
              checked={prioritizeMissingPhoto}
              onChange={(e) => setPrioritizeMissingPhoto(e.target.checked)}
              className="w-4 h-4 rounded text-amber-500 bg-gray-950 border-gray-700"
            />
            <span>写真未登録の島（{missingPhotoIslandsCount}島）への投稿を優先表示</span>
          </label>

          <label className="inline-flex items-center gap-2 cursor-pointer bg-gray-950 border border-gray-800 px-3.5 py-2 rounded-xl text-xs font-bold text-gray-300">
            <input
              type="checkbox"
              checked={onlyMissingFilter}
              onChange={(e) => setOnlyMissingFilter(e.target.checked)}
              className="w-4 h-4 rounded text-sky-500 bg-gray-950 border-gray-700"
            />
            <span>未登録の島のみに絞り込む</span>
          </label>
        </div>

        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="島名・都道府県・島IDで検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-950 border border-gray-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Photo Grid */}
      {loading ? (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center text-xs text-gray-400">
          投稿写真を読み込み中...
        </div>
      ) : displayedDiaries.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-gray-500 mx-auto" />
          <p className="text-sm font-bold text-gray-300">条件に一致する投稿写真がありません</p>
          <p className="text-xs text-gray-500">
            検索条件や「未登録の島のみに絞り込む」フィルタを解除してお試しください。
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {displayedDiaries.map((item) => {
            const isProcessing = adoptingId === item.id;
            return (
              <div
                key={item.id}
                className={`bg-gray-900 rounded-2xl overflow-hidden border flex flex-col justify-between transition shadow-lg ${
                  item.isAdopted
                    ? 'border-emerald-500/50'
                    : item.needsOfficialPhoto
                    ? 'border-amber-500/50'
                    : 'border-gray-800'
                }`}
              >
                <div>
                  {/* Image Preview */}
                  <div className="relative h-52 bg-gray-950 overflow-hidden group">
                    <img
                      src={item.photo_url}
                      alt={`${item.island_name} 投稿写真`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
                      {item.needsOfficialPhoto ? (
                        <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 text-[10px] font-black shadow flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          公式写真未登録の島
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg bg-gray-900/85 text-gray-300 border border-gray-700 text-[10px] font-bold">
                          公式写真あり
                        </span>
                      )}
                      {item.isAdopted && (
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 text-[10px] font-black shadow flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          採用済み
                        </span>
                      )}
                    </div>
                    <a
                      href={item.photo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-black/70 hover:bg-black/90 text-white text-[10px] font-bold flex items-center gap-1 backdrop-blur-sm"
                    >
                      原寸確認 <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {/* Metadata */}
                  <div className="p-4 space-y-2.5 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] text-gray-400 font-bold block">
                          {item.prefecture || '日本離島'} / ID: {item.island_id}
                        </span>
                        <h3 className="text-base font-extrabold text-white">{item.island_name}</h3>
                      </div>
                      <span className="text-[10px] font-mono text-gray-500 shrink-0">
                        {item.created_at
                          ? new Date(item.created_at).toLocaleDateString('ja-JP')
                          : ''}
                      </span>
                    </div>

                    {item.content && (
                      <p className="text-gray-300 line-clamp-2 text-[11px] leading-relaxed bg-gray-950/60 p-2.5 rounded-xl border border-gray-800/80">
                        {item.content}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1">
                      <span className="truncate">
                        投稿者:{' '}
                        <strong className="text-gray-200">
                          {item.author_nickname ||
                            (item.author_user_id ? `${item.author_user_id.slice(0, 8)}...` : '不明')}
                        </strong>
                      </span>
                      {item.author_adopted_count > 0 && (
                        <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-950/60 border border-amber-700/40 px-2 py-0.5 rounded-full">
                          <Award className="w-3 h-3" />
                          公認採用 {item.author_adopted_count}回
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="p-4 pt-0">
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => void handleAdoptPhoto(item)}
                    className={`w-full py-3 px-4 rounded-xl font-extrabold text-xs transition shadow flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50 ${
                      item.isAdopted
                        ? 'bg-emerald-900/50 hover:bg-emerald-800/60 text-emerald-200 border border-emerald-700/60'
                        : 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950'
                    }`}
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        処理中...
                      </>
                    ) : item.isAdopted ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        ✓ 公式写真に採用済み（写真を再適用）
                      </>
                    ) : (
                      <>
                        <Ticket className="w-4 h-4" />
                        📸 公式写真に採用（＋チケット1枚進呈）
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
