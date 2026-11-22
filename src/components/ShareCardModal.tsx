'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Share2, Sparkles, Check, Smartphone, Monitor } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTravel } from '@/context/TravelContext';
import { getVerifiedIslandPhotos } from '@/lib/islandPhoto';
import { drawOfficialSquareHanko } from '@/lib/officialSeal';
import regionsData from '@/data/regions.json';

interface ShareCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  island: any;
  checkinDate?: string;
  photoUrl?: string | null;
}

export default function ShareCardModal({
  isOpen,
  onClose,
  island,
  checkinDate,
  photoUrl,
}: ShareCardModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [aspectMode, setAspectMode] = useState<'landscape' | 'portrait'>('landscape');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const { travelerName, totalVisited, totalPoints, conquestTargetCount, tempCheckInPhotoUrl } = useTravel();

  const formattedDate = checkinDate || new Date().toISOString().split('T')[0].replace(/-/g, '.');

  // Canvas描画処理
  useEffect(() => {
    if (!isOpen || !island) return;

    let isCancelled = false;
    setIsRendering(true);

    const renderCard = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const isLandscape = aspectMode === 'landscape';
      const width = isLandscape ? 1200 : 1080;
      const height = isLandscape ? 630 : 1920;

      canvas.width = width;
      canvas.height = height;

      // 1. 背景の描画（ユーザー撮影写真、検証済み現地写真、またはグラデーション。偽画像は一切使用しない）
      const bgImg = new Image();

      const storedPhoto = (() => {
        if (typeof window === 'undefined' || !island?.id) return null;
        try {
          return (
            sessionStorage.getItem(`kiratabi_checkin_photo_${island.id}`) ||
            localStorage.getItem(`kiratabi_checkin_photo_${island.id}`)
          );
        } catch {
          return null;
        }
      })();

      const verified = getVerifiedIslandPhotos(island);
      const imgSrc =
        photoUrl ||
        tempCheckInPhotoUrl ||
        storedPhoto ||
        (!isLandscape && verified.mobileUrl ? verified.mobileUrl : verified.desktopUrl) ||
        verified.mobileUrl ||
        '';

      const loadImage = (src: string) => {
        if (!src) return Promise.resolve(null);
        return new Promise<HTMLImageElement | null>((resolve) => {
          if (!src.startsWith('data:') && !src.startsWith('blob:')) {
            bgImg.crossOrigin = 'anonymous';
          }
          bgImg.onload = () => resolve(bgImg);
          bgImg.onerror = () => resolve(null);
          bgImg.src = src;
        });
      };

      const loadedImg = await loadImage(imgSrc);

      if (isCancelled) return;

      if (loadedImg) {
        // 画像を中央配置でcover描画
        const imgRatio = loadedImg.width / loadedImg.height;
        const targetRatio = width / height;
        let dw = width;
        let dh = height;
        let dx = 0;
        let dy = 0;

        if (imgRatio > targetRatio) {
          dw = height * imgRatio;
          dx = (width - dw) / 2;
        } else {
          dh = width / imgRatio;
          dy = (height - dh) / 2;
        }

        ctx.drawImage(loadedImg, dx, dy, dw, dh);
      } else {
        // グラデーション背景フォールバック
        const bgGrad = ctx.createLinearGradient(0, 0, width, height);
        bgGrad.addColorStop(0, '#0f172a');
        bgGrad.addColorStop(0.5, '#0369a1');
        bgGrad.addColorStop(1, '#0f172a');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);
      }

      // 2. スタイリッシュなダークグラデーションオーバーレイ
      const darkGrad = ctx.createLinearGradient(0, 0, 0, height);
      if (isLandscape) {
        darkGrad.addColorStop(0, 'rgba(15, 23, 42, 0.4)');
        darkGrad.addColorStop(0.4, 'rgba(15, 23, 42, 0.6)');
        darkGrad.addColorStop(1, 'rgba(15, 23, 42, 0.95)');
      } else {
        darkGrad.addColorStop(0, 'rgba(15, 23, 42, 0.5)');
        darkGrad.addColorStop(0.3, 'rgba(15, 23, 42, 0.3)');
        darkGrad.addColorStop(0.7, 'rgba(15, 23, 42, 0.7)');
        darkGrad.addColorStop(1, 'rgba(15, 23, 42, 0.98)');
      }
      ctx.fillStyle = darkGrad;
      ctx.fillRect(0, 0, width, height);

      // 3. 金色・白の装飾ボーダーフレーム
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 2;
      const margin = isLandscape ? 40 : 60;
      ctx.strokeRect(margin, margin, width - margin * 2, height - margin * 2);

      // 内側のゴールドアクセントライン
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)';
      ctx.lineWidth = 1;
      ctx.strokeRect(margin + 8, margin + 8, width - (margin + 8) * 2, height - (margin + 8) * 2);

      // 4. ヘッダーロゴ＆タイトル
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 24px "Noto Serif JP", serif';
      ctx.textAlign = 'left';
      ctx.fillText('輝旅 島専科', margin + 35, margin + 55);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('KIRATABI SHIMASENKA - 全国離島制覇の旅', margin + 35, margin + 85);

      // 5. 到達バッジ
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('★ OFFICIAL CONQUEST CERTIFICATE', width - margin - 35, margin + 55);

      const safeIslandId = String(island?.id || '0').padStart(4, '0');
      ctx.fillStyle = '#94a3b8';
      ctx.font = '16px monospace';
      ctx.fillText(`NO. ${safeIslandId}-${Date.now().toString().slice(-6)}`, width - margin - 35, margin + 85);

      const regionObj = regionsData.find((r) => r.id === island?.region_id);
      const regionLabel = regionObj?.name || island.region_id || '離島航路';

      const drawAutoFitText = (
        text: string,
        x: number,
        y: number,
        maxWidth: number,
        basePx: number,
        minPx: number,
        family: string
      ) => {
        let px = basePx;
        ctx.font = `bold ${px}px ${family}`;
        while (px > minPx && ctx.measureText(text).width > maxWidth) {
          px -= 2;
          ctx.font = `bold ${px}px ${family}`;
        }
        ctx.fillText(text, x, y, maxWidth);
      };

      // 6. メインコンテンツ（島名・都道府県・公式官印）
      if (isLandscape) {
        // 横型レイアウト (1200 x 630 / 右下公印エリア x = 975..1125 と完全に非重複)
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        const maxLeftTextW = 870;

        // 都道府県・地域 ＋ 到達達成バッジ
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 22px sans-serif';
        const locText = `📍 ${island.prefecture || '日本'} / ${regionLabel}`;
        ctx.fillText(locText, margin + 40, height - 255, 620);

        const locW = Math.min(ctx.measureText(locText).width, 620);
        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 22px sans-serif';
        ctx.fillText('★ 到達達成！', margin + 40 + locW + 22, height - 255);

        // 島名（自動フォントサイズ調整で公印と絶対に被らない）
        ctx.fillStyle = '#ffffff';
        drawAutoFitText(island.name, margin + 40, height - 160, maxLeftTextW, 72, 38, '"Hiragino Mincho ProN", "Yu Mincho", "Noto Serif JP", serif');

        // 詳細情報（到達日・トラベラー・累計島数）
        ctx.fillStyle = '#cbd5e1';
        drawAutoFitText(
          `📅 到達日: ${formattedDate}   👤 旅人: ${travelerName || '島旅トラベラー'}   🏝️ 累計到達: ${Math.max(totalVisited || 1, 1)}島制覇`,
          margin + 40,
          height - 96,
          maxLeftTextW,
          20,
          15,
          'sans-serif'
        );

        // 右下の本格・二重枠本朱官印「輝旅島専 / 公式到達 / 認定之印」
        drawOfficialSquareHanko(ctx, width - margin - 102, height - margin - 104, 124, {
          onDarkBackground: true,
        });
      } else {
        // 縦型レイアウト（Instagramストーリーズ用 1080 x 1920）
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';

        // 中央の島名
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 34px sans-serif';
        ctx.fillText(`📍 ${island.prefecture || '日本'} ・ ${regionLabel}`, width / 2, height / 2 - 125, width - 160);

        ctx.fillStyle = '#ffffff';
        drawAutoFitText(island.name, width / 2, height / 2 + 10, width - 160, 104, 52, '"Hiragino Mincho ProN", "Yu Mincho", "Noto Serif JP", serif');

        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 44px sans-serif';
        ctx.fillText('＼ 到達達成！ ／', width / 2, height / 2 + 100);

        // カード下部のサマリーボックス
        const boxY = height - margin - 420;
        const boxW = width - (margin + 40) * 2;
        const boxH = 340;
        const boxLeft = (width - boxW) / 2;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.76)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(boxLeft, boxY, boxW, boxH, 24);
        ctx.fill();
        ctx.stroke();

        ctx.textAlign = 'left';
        const startX = boxLeft + 46;
        const summaryMaxW = boxW - 260;

        ctx.fillStyle = '#e2e8f0';
        drawAutoFitText(`📅 到達日: ${formattedDate}`, startX, boxY + 76, summaryMaxW, 28, 20, 'sans-serif');
        drawAutoFitText(`👤 旅人名: ${travelerName || '島旅トラベラー'}`, startX, boxY + 146, summaryMaxW, 28, 20, 'sans-serif');
        drawAutoFitText(`🏝️ 制覇実績: ${Math.max(totalVisited || 1, 1)} / ${conquestTargetCount || 417} 島`, startX, boxY + 216, summaryMaxW, 28, 20, 'sans-serif');
        drawAutoFitText(`⭐ 獲得XP: +${totalPoints > 0 ? totalPoints : 100} pt`, startX, boxY + 286, summaryMaxW, 28, 20, 'sans-serif');

        // 右側の本格・二重枠本朱官印「輝旅島専 / 公式到達 / 認定之印」
        drawOfficialSquareHanko(ctx, boxLeft + boxW - 118, boxY + boxH / 2, 152, {
          onDarkBackground: true,
        });
      }

      // 生成した画像DataURLをstateに保存（CORSエラー時は安全にハンドリング）
      try {
        const dataUrl = canvas.toDataURL('image/png');
        setGeneratedImageUrl(dataUrl);
      } catch (err) {
        console.warn('Canvas toDataURL failed (possibly tainted cross-origin image):', err);
      } finally {
        setIsRendering(false);
      }
    };

    renderCard();

    return () => {
      isCancelled = true;
    };
  }, [isOpen, island, aspectMode, travelerName, totalVisited, totalPoints, conquestTargetCount, formattedDate, photoUrl, tempCheckInPhotoUrl]);

  if (!isOpen) return null;

  // ダウンロード実行
  const handleDownload = () => {
    if (!generatedImageUrl) return;
    const a = document.createElement('a');
    a.href = generatedImageUrl;
    a.download = `KIRATABI_${island.name}_到達証明書_${aspectMode}.png`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      try {
        if (a.parentNode) document.body.removeChild(a);
      } catch {
        // ignore
      }
    }, 1000);
    toast.success('📸 到達証明カード画像を保存しました！');
  };

  // X（旧Twitter）シェア
  const handleShareX = () => {
    const text = `日本の離島「${island.name}（${island.prefecture || ''}）」に到達しました！🏝️✨\n現在【${Math.max(totalVisited, 1)}島】制覇中！\n\n#キラ旅 #島専科 #離島制覇 #${island.name}`;
    const url = `https://island.kira-tabi.com/island/${island.id}`;
    const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(xUrl, '_blank', 'noopener,noreferrer');
  };

  // リンクコピー
  const handleCopyLink = () => {
    const url = `https://island.kira-tabi.com/island/${island.id}`;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    toast.success('🔗 島のリンクをコピーしました！');
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="p-5 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">SNS到達証明カード生成</h3>
                <p className="text-xs text-slate-400">画像として保存して、XやInstagramで旅の記録をシェアしよう！</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Size Switcher */}
          <div className="px-6 pt-4 pb-2 flex items-center justify-center gap-3 shrink-0">
            <button
              onClick={() => setAspectMode('landscape')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
                aspectMode === 'landscape'
                  ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-900/40'
                  : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              <Monitor size={15} /> X（Twitter）/ 横型 (16:9)
            </button>
            <button
              onClick={() => setAspectMode('portrait')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
                aspectMode === 'portrait'
                  ? 'bg-gradient-to-r from-pink-600 to-rose-600 border-pink-400 text-white shadow-lg shadow-pink-900/40'
                  : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone size={15} /> Instagram / 縦型 (9:16)
            </button>
          </div>

          {/* Canvas Preview Area */}
          <div className="p-5 overflow-y-auto flex-1 flex flex-col items-center justify-center custom-scrollbar">
            {/* 実際のレンダリング用キャンバス（非表示） */}
            <canvas ref={canvasRef} className="hidden" />

            {/* プレビュー画像 */}
            {isRendering ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
                <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
                <p className="text-xs font-bold">高画質カードを生成中...</p>
              </div>
            ) : generatedImageUrl ? (
              <div className="relative rounded-2xl overflow-hidden border border-slate-700 shadow-2xl max-w-full">
                <img
                  src={generatedImageUrl}
                  alt={`${island.name} 到達証明カード`}
                  className={`object-contain rounded-2xl ${
                    aspectMode === 'landscape' ? 'max-h-[320px] w-auto' : 'max-h-[380px] w-auto'
                  }`}
                />
              </div>
            ) : null}
          </div>

          {/* Action Buttons */}
          <div className="p-5 bg-slate-900 border-t border-slate-800 flex flex-col sm:flex-row gap-3 shrink-0">
            <button
              onClick={handleDownload}
              disabled={isRendering || !generatedImageUrl}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
            >
              <Download size={18} />
              <span>画像を保存する</span>
            </button>

            <button
              onClick={handleShareX}
              className="py-3 px-5 rounded-xl bg-[#1DA1F2] hover:bg-[#1a94e0] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-sky-900/40 transition-all"
            >
              <Share2 size={16} />
              <span>Xでシェア</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm flex items-center justify-center gap-2 border border-slate-700 transition-all"
            >
              {isCopied ? <Check size={16} className="text-emerald-400" /> : null}
              <span>{isCopied ? 'コピー済' : 'リンク'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
