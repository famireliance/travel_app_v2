'use client';

import React, { useState } from 'react';
import { Compass, MapPin, Camera, Maximize2, X, ChevronLeft, ChevronRight, Smartphone, Satellite } from 'lucide-react';
import { getVerifiedIslandPhotos, getCenteredAerialTileGrid, formatNauticalCoordinates } from '@/lib/islandPhoto';

interface AuthenticIslandCardImageProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  island: any;
  className?: string;
  showBadgeOnPlaceholder?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * カード・サムネイル用の厳格な実地写真＆実座標空撮コンポーネント
 * - 検証済み実地写真がある場合は1対1の固有写真を表示（重複・他島流用ゼロ）
 * - 地上写真が未登録の小島・無人島では、その島の正確な緯度経度を中心とする実写衛星空撮を表示
 */
export function AuthenticIslandCardImage({
  island,
  className = '',
  showBadgeOnPlaceholder = true,
  size = 'md',
}: AuthenticIslandCardImageProps) {
  const [imgError, setImgError] = useState(false);
  const [aerialError, setAerialError] = useState(false);
  const photoMeta = getVerifiedIslandPhotos(island);

  if (photoMeta.hasVerifiedPhoto && !imgError) {
    return (
      <div className={`relative w-full h-full overflow-hidden bg-slate-900 ${className}`}>
        {photoMeta.mobileUrl && photoMeta.desktopUrl && photoMeta.mobileUrl !== photoMeta.desktopUrl ? (
          <>
            <img
              src={photoMeta.mobileUrl}
              alt={`${island?.name || '離島'} 実地写真`}
              loading="lazy"
              style={{ objectPosition: photoMeta.focalPoint }}
              onError={() => setImgError(true)}
              className="block md:hidden w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <img
              src={photoMeta.desktopUrl}
              alt={`${island?.name || '離島'} 実地写真`}
              loading="lazy"
              style={{ objectPosition: photoMeta.focalPoint }}
              onError={() => setImgError(true)}
              className="hidden md:block w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </>
        ) : (
          <img
            src={photoMeta.desktopUrl || photoMeta.mobileUrl || ''}
            alt={`${island?.name || '離島'} 実地写真`}
            loading="lazy"
            style={{ objectPosition: photoMeta.focalPoint }}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        )}
      </div>
    );
  }

  const dms = formatNauticalCoordinates(island?.coordinates);
  const aerialGrid = !aerialError
    ? getCenteredAerialTileGrid(island?.coordinates, Number(island?.radius_m) || undefined)
    : null;

  if (aerialGrid) {
    return (
      <div className={`relative w-full h-full overflow-hidden bg-slate-950 select-none ${className}`}>
        {/* 島の正確な緯度経度を常にカード中央(50%,50%)に収める 2x2 リアル衛星空撮レイヤー */}
        <div
          className="absolute w-[200%] h-[200%] grid grid-cols-2 grid-rows-2 pointer-events-none group-hover:scale-105 transition-transform duration-700"
          style={{
            left: `${aerialGrid.offsetLeftPct}%`,
            top: `${aerialGrid.offsetTopPct}%`,
          }}
        >
          {aerialGrid.tiles.map((tile) => (
            <img
              key={tile.key}
              src={tile.url}
              alt=""
              loading="lazy"
              onError={() => setAerialError(true)}
              className="w-full h-full object-cover block"
            />
          ))}
        </div>

        {/* 視認性向上グラデーション＆ターゲットレティクル */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/10 to-slate-950/45 pointer-events-none" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border border-cyan-300/45 pointer-events-none flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_6px_rgba(103,232,249,0.9)]" />
        </div>

        {showBadgeOnPlaceholder && size !== 'sm' && (
          <div className="absolute top-2 left-2 z-10 px-1.5 py-0.5 rounded bg-slate-950/75 backdrop-blur-sm border border-cyan-400/30 text-[8px] font-bold text-cyan-200 flex items-center gap-1">
            <Satellite className="w-2.5 h-2.5 text-cyan-300" />
            <span>衛星空撮</span>
          </div>
        )}

        <div className="absolute bottom-1.5 left-2 right-2 z-10 flex items-center justify-between text-[9px] text-white/85 drop-shadow">
          <span className="font-mono text-[8px] text-cyan-200/90 truncate">
            {size === 'sm' ? island?.prefecture || '' : dms}
          </span>
        </div>
      </div>
    );
  }

  // 万一オフライン等で衛星タイルも取得不可の場合の海図フォールバック
  return (
    <div
      className={`relative w-full h-full overflow-hidden bg-gradient-to-br from-slate-900 via-[#0c1e35] to-slate-950 flex flex-col justify-between p-3 select-none ${className}`}
    >
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.25) 1px, transparent 1px), linear-gradient(to right, rgba(148, 163, 184, 0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(148, 163, 184, 0.12) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
      <div className="relative z-10 flex items-center justify-between gap-1">
        <span className="text-[9px] font-mono text-cyan-300/80 tracking-tight truncate">
          {size === 'sm' ? 'ARCHIPELAGO' : dms}
        </span>
      </div>
      <div className="relative z-10 my-auto flex flex-col items-center justify-center text-center py-1">
        <div className="w-7 h-7 rounded-full bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-300 mb-1">
          <Compass className="w-3.5 h-3.5" />
        </div>
        {size !== 'sm' && (
          <p className="font-serif font-bold text-white/90 text-xs tracking-widest line-clamp-1">
            {island?.name}
          </p>
        )}
      </div>
      <div className="relative z-10 flex items-center justify-between text-[9px] text-slate-400">
        <span className="truncate">{island?.prefecture || '日本離島'}</span>
      </div>
    </div>
  );
}

interface AuthenticIslandHeroProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  island: any;
  onBack: () => void;
  difficultyInfo?: { level: number; stars: string; label: string; badgeColor: string } | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  currentWeather?: any;
}

/**
 * 島詳細ページ（/island/[id]）用のレスポンシブ・スマートヒーローセクション
 */
export function AuthenticIslandHero({
  island,
  onBack,
  difficultyInfo,
  currentWeather,
}: AuthenticIslandHeroProps) {
  const photoMeta = getVerifiedIslandPhotos(island);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [mobileFitOverride, setMobileFitOverride] = useState<'contain_blur' | 'cover' | null>(null);
  const [imgError, setImgError] = useState(false);
  const [aerialError, setAerialError] = useState(false);

  const effectiveMobileMode = mobileFitOverride || photoMeta.mobileDisplayMode;
  const gallery = photoMeta.galleryUrls;
  const currentDesktopSrc = gallery[activePhotoIdx] || photoMeta.desktopUrl || photoMeta.mobileUrl || '';
  const hasSeparateMobilePortrait = Boolean(
    photoMeta.mobileUrl && activePhotoIdx === 0 && photoMeta.mobileUrl !== photoMeta.desktopUrl
  );
  const dms = formatNauticalCoordinates(island?.coordinates);
  const badgeLabel = photoMeta.photoSource === 'wikimedia' ? '実地検証フォト' : '現地実写';

  if (photoMeta.hasVerifiedPhoto && !imgError) {
    return (
      <>
        <div className="relative w-full bg-slate-950 overflow-hidden">
          {/* A. スマートフォン専用ビュー (< 768px) */}
          <div className="block md:hidden">
            {hasSeparateMobilePortrait ? (
              <div className="relative w-full h-[54vh] min-h-[360px] max-h-[520px] overflow-hidden">
                <img
                  src={photoMeta.mobileUrl!}
                  alt={`${island.name} 実地写真`}
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover"
                  style={{ objectPosition: photoMeta.focalPoint }}
                  onClick={() => setIsLightboxOpen(true)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/40 pointer-events-none" />
              </div>
            ) : (
              <div className="relative w-full pt-16 pb-2 bg-slate-950 overflow-hidden">
                <img
                  src={currentDesktopSrc}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-45 pointer-events-none"
                />
                <div className="absolute inset-0 bg-slate-950/40 pointer-events-none" />

                <div
                  className={`relative z-10 mx-auto w-full ${
                    effectiveMobileMode === 'contain_blur'
                      ? 'aspect-[16/10] max-h-[300px]'
                      : 'h-[42vh] min-h-[260px]'
                  } overflow-hidden shadow-2xl border-y border-white/10 bg-slate-900/60`}
                  onClick={() => setIsLightboxOpen(true)}
                >
                  <img
                    src={currentDesktopSrc}
                    alt={`${island.name} 実地写真`}
                    onError={() => setImgError(true)}
                    style={{ objectPosition: photoMeta.focalPoint }}
                    className={`w-full h-full transition-all duration-300 ${
                      effectiveMobileMode === 'contain_blur' ? 'object-contain' : 'object-cover'
                    }`}
                  />

                  <div
                    className="absolute bottom-2.5 right-2.5 z-20 flex items-center gap-1.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setMobileFitOverride(effectiveMobileMode === 'contain_blur' ? 'cover' : 'contain_blur')
                      }
                      className="px-2.5 py-1 rounded-full bg-black/65 backdrop-blur-md border border-white/20 text-[10px] font-bold text-white flex items-center gap-1 shadow-md active:scale-95"
                    >
                      <Smartphone className="w-3 h-3 text-cyan-300" />
                      {effectiveMobileMode === 'contain_blur' ? 'ズーム表示' : '全体表示'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsLightboxOpen(true)}
                      className="px-2.5 py-1 rounded-full bg-black/65 backdrop-blur-md border border-white/20 text-[10px] font-bold text-white flex items-center gap-1 shadow-md active:scale-95"
                    >
                      <Maximize2 className="w-3 h-3 text-cyan-300" />
                      拡大
                    </button>
                  </div>

                  <div className="absolute bottom-2.5 left-2.5 z-20 px-2 py-0.5 rounded-full bg-emerald-950/80 backdrop-blur-md border border-emerald-400/30 text-[10px] font-bold text-emerald-300 flex items-center gap-1">
                    <Camera className="w-3 h-3" />
                    {badgeLabel}
                  </div>
                </div>
              </div>
            )}

            <div className="relative z-20 px-5 pt-3 pb-14 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900 text-white">
              {gallery.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-2 hide-scrollbar">
                  {gallery.map((gUrl, idx) => (
                    <button
                      key={gUrl + idx}
                      type="button"
                      onClick={() => setActivePhotoIdx(idx)}
                      className={`relative w-14 h-10 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                        idx === activePhotoIdx
                          ? 'border-cyan-400 scale-105 shadow-md'
                          : 'border-white/20 opacity-60'
                      }`}
                    >
                      <img src={gUrl} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="text-[0.65rem] font-bold tracking-[0.25em] uppercase text-cyan-300">
                  {island.prefecture || island.region_id}
                </p>
                <span className="text-[10px] font-mono text-slate-400">{dms}</span>
              </div>
              <h1 className="font-serif font-bold text-3xl tracking-widest text-white">
                {island.name}
              </h1>

              <div className="flex flex-wrap items-center gap-2.5 mt-3">
                {difficultyInfo && difficultyInfo.level > 0 && (
                  <div
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-md ${difficultyInfo.badgeColor}`}
                  >
                    <span className="tracking-widest">{difficultyInfo.stars}</span>
                    <span>{difficultyInfo.label}</span>
                  </div>
                )}
                {currentWeather && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-bold text-white">
                    {currentWeather.icon && currentWeather.icon.length <= 4 ? (
                      <img src={`https://openweathermap.org/img/wn/${currentWeather.icon}.png`} alt={currentWeather.description || ''} className="w-5 h-5 -my-1" />
                    ) : (
                      <span>{currentWeather.icon}</span>
                    )}
                    <span>{currentWeather.temp}°C {currentWeather.description || ''}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* B. PC・タブレット表示 (>= 768px) */}
          <div className="hidden md:block relative w-full h-[58vh] min-h-[440px] max-h-[640px] overflow-hidden">
            <img
              src={currentDesktopSrc}
              alt={`${island.name} 実地写真`}
              onError={() => setImgError(true)}
              style={{ objectPosition: photoMeta.focalPoint }}
              className="w-full h-full object-cover transition-all duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-black/15 to-black/35 pointer-events-none" />

            <div className="absolute top-10 right-12 z-30 flex items-center gap-2.5">
              <div className="px-3 py-1.5 rounded-full bg-emerald-950/75 backdrop-blur-md border border-emerald-400/30 text-xs font-bold text-emerald-300 flex items-center gap-1.5 shadow-lg">
                <Camera className="w-3.5 h-3.5" />
                {badgeLabel}
              </div>
              <button
                type="button"
                onClick={() => setIsLightboxOpen(true)}
                className="px-3.5 py-1.5 rounded-full bg-black/45 hover:bg-black/70 backdrop-blur-md border border-white/25 text-xs font-bold text-white flex items-center gap-1.5 transition shadow-lg"
              >
                <Maximize2 className="w-3.5 h-3.5 text-cyan-300" />
                写真を拡大表示 {gallery.length > 1 ? `(${activePhotoIdx + 1}/${gallery.length})` : ''}
              </button>
            </div>

            <div className="absolute bottom-12 left-12 right-12 z-20 flex items-end justify-between gap-8 text-white">
              <div>
                <p className="text-xs font-bold tracking-[0.3em] uppercase mb-2 text-cyan-300 drop-shadow-md">
                  {island.prefecture || island.region_id}
                  <span className="ml-3 font-mono text-white/60 text-[11px]">{dms}</span>
                </p>
                <h1 className="font-serif font-bold text-5xl lg:text-6xl tracking-widest text-white drop-shadow-lg">
                  {island.name}
                </h1>
                <div className="flex flex-wrap items-center gap-3 mt-4">
                  {difficultyInfo && difficultyInfo.level > 0 && (
                    <div
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold shadow-md ${difficultyInfo.badgeColor}`}
                    >
                      <span className="tracking-widest">{difficultyInfo.stars}</span>
                      <span>{difficultyInfo.label}</span>
                    </div>
                  )}
                  {currentWeather && (
                    <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-xs font-bold text-white shadow-md">
                      {currentWeather.icon && currentWeather.icon.length <= 4 ? (
                        <img src={`https://openweathermap.org/img/wn/${currentWeather.icon}.png`} alt={currentWeather.description || ''} className="w-5 h-5 -my-1" />
                      ) : (
                        <span>{currentWeather.icon}</span>
                      )}
                      <span>{currentWeather.temp}°C {currentWeather.description || ''}</span>
                    </div>
                  )}
                </div>
              </div>

              {gallery.length > 1 && (
                <div className="flex items-center gap-2.5 bg-black/40 backdrop-blur-md p-2 rounded-2xl border border-white/15">
                  {gallery.map((gUrl, idx) => (
                    <button
                      key={gUrl + idx}
                      type="button"
                      onClick={() => setActivePhotoIdx(idx)}
                      className={`relative w-16 h-12 rounded-xl overflow-hidden border-2 transition-all ${
                        idx === activePhotoIdx
                          ? 'border-cyan-400 scale-105 shadow-lg'
                          : 'border-transparent opacity-65 hover:opacity-100'
                      }`}
                    >
                      <img src={gUrl} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <header className="absolute top-0 left-0 right-0 z-40 px-4 md:px-12 pt-3 md:pt-10 pb-3 flex items-center justify-between pointer-events-none">
            <button
              type="button"
              onClick={onBack}
              className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-black/45 backdrop-blur-md border border-white/25 flex items-center justify-center text-white hover:bg-black/70 transition-colors shadow-lg pointer-events-auto"
              title="前のページに戻る"
            >
              <ArrowLeftIcon />
            </button>
          </header>
        </div>

        {/* 全画面ライトボックス */}
        {isLightboxOpen && (
          <div
            className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4"
            onClick={() => setIsLightboxOpen(false)}
          >
            <div className="absolute top-5 left-5 right-5 flex items-center justify-between text-white z-20">
              <div>
                <p className="font-serif font-bold text-base md:text-lg">{island.name} フォトギャラリー</p>
                {photoMeta.caption && (
                  <p className="text-xs text-slate-400">{photoMeta.caption}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div
              className="relative max-w-6xl w-full max-h-[80vh] flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={currentDesktopSrc}
                alt={island.name}
                className="max-w-full max-h-[78vh] object-contain rounded-lg shadow-2xl"
              />
              {gallery.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setActivePhotoIdx((prev) => (prev - 1 + gallery.length) % gallery.length)}
                    className="absolute left-2 md:left-4 w-11 h-11 rounded-full bg-black/60 hover:bg-black/80 border border-white/20 flex items-center justify-center text-white"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePhotoIdx((prev) => (prev + 1) % gallery.length)}
                    className="absolute right-2 md:right-4 w-11 h-11 rounded-full bg-black/60 hover:bg-black/80 border border-white/20 flex items-center justify-center text-white"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>

            {gallery.length > 1 && (
              <div
                className="mt-4 flex items-center gap-2 overflow-x-auto max-w-full px-4"
                onClick={(e) => e.stopPropagation()}
              >
                {gallery.map((gUrl, idx) => (
                  <button
                    key={gUrl + idx}
                    type="button"
                    onClick={() => setActivePhotoIdx(idx)}
                    className={`w-16 h-11 rounded-lg overflow-hidden border-2 shrink-0 ${
                      idx === activePhotoIdx ? 'border-cyan-400' : 'border-white/20 opacity-50'
                    }`}
                  >
                    <img src={gUrl} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </>
    );
  }

  // =========================================================================
  // 地上写真が未登録の小島・無人島：その島固有の実写衛星空撮＋座標ヒーローを表示
  // =========================================================================
  const aerialGrid = !aerialError
    ? getCenteredAerialTileGrid(island?.coordinates, Number(island?.radius_m) || undefined)
    : null;

  return (
    <div className="relative w-full min-h-[42vh] md:h-[50vh] bg-gradient-to-br from-slate-950 via-[#0a1d37] to-slate-900 overflow-hidden flex flex-col justify-end pb-14 pt-20 px-6 lg:px-12">
      {aerialGrid ? (
        <>
          <div
            className="absolute w-[200%] h-[200%] grid grid-cols-2 grid-rows-2 pointer-events-none opacity-75"
            style={{
              left: `${aerialGrid.offsetLeftPct}%`,
              top: `${aerialGrid.offsetTopPct}%`,
            }}
          >
            {aerialGrid.tiles.map((tile) => (
              <img
                key={tile.key}
                src={tile.url}
                alt=""
                onError={() => setAerialError(true)}
                className="w-full h-full object-cover block"
              />
            ))}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/45 to-slate-950/55 pointer-events-none" />
        </>
      ) : (
        <div
          className="absolute inset-0 opacity-25 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 50% 40%, rgba(56, 189, 248, 0.25) 1px, transparent 1px), linear-gradient(to right, rgba(148, 163, 184, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(148, 163, 184, 0.1) 1px, transparent 1px)',
            backgroundSize: '36px 36px',
          }}
        />
      )}

      <header className="absolute top-0 left-0 right-0 z-40 px-6 lg:px-12 pt-8 md:pt-10 pb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="w-11 h-11 rounded-full bg-black/45 backdrop-blur-md border border-white/25 flex items-center justify-center text-white hover:bg-black/70 transition-colors shadow-lg"
          title="前のページに戻る"
        >
          <ArrowLeftIcon />
        </button>

        <div className="px-3 py-1.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-cyan-400/35 text-[11px] font-bold text-cyan-200 flex items-center gap-1.5">
          <Satellite className="w-3.5 h-3.5 text-cyan-400" />
          <span>実座標・衛星空撮ビュー</span>
        </div>
      </header>

      <div className="relative z-10 max-w-4xl w-full mx-auto text-white">
        <div className="flex flex-wrap items-center gap-2.5 mb-2">
          <span className="text-xs font-bold tracking-[0.25em] uppercase text-cyan-300 drop-shadow">
            {island.prefecture || island.region_id}
          </span>
          <span className="px-2.5 py-0.5 rounded-md bg-black/45 backdrop-blur-sm border border-white/20 font-mono text-xs text-cyan-200 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-cyan-400" />
            {dms}
          </span>
        </div>

        <h1 className="font-serif font-bold text-3xl md:text-5xl lg:text-6xl tracking-widest text-white drop-shadow-lg">
          {island.name}
        </h1>

        <div className="flex flex-wrap items-center gap-3 mt-4">
          {difficultyInfo && difficultyInfo.level > 0 && (
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-md ${difficultyInfo.badgeColor}`}
            >
              <span className="tracking-widest">{difficultyInfo.stars}</span>
              <span>{difficultyInfo.label}</span>
            </div>
          )}
          {currentWeather && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/45 backdrop-blur-md border border-white/20 text-xs font-bold text-white">
              {currentWeather.icon && currentWeather.icon.length <= 4 ? (
                <img src={`https://openweathermap.org/img/wn/${currentWeather.icon}.png`} alt={currentWeather.description || ''} className="w-5 h-5 -my-1" />
              ) : (
                <span>{currentWeather.icon}</span>
              )}
              <span>{currentWeather.temp}°C {currentWeather.description || ''}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ArrowLeftIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  );
}
