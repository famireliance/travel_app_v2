'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Share2, Award, Camera, CheckCircle, Sparkles, Send, Calendar, User } from 'lucide-react';

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  island: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user?: any;
}

import { useTravel } from '@/context/TravelContext';
import { getFormattedSerial, getIslandDifficulty } from '@/lib/difficulty';

export default function CertificateModal({ isOpen, onClose, island, user }: CertificateModalProps) {
  const { travelerName: contextTravelerName, updateTravelerName, companionChar, companionStage, islandStatuses } = useTravel();
  const status = island ? (islandStatuses[island.id] || 'none') : 'none';
  const isVerified = status === 'verified_visited';
  const [travelerName, setTravelerName] = useState<string>('');
  const [visitDate, setVisitDate] = useState<string>('');
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [includeCompanionStamp, setIncludeCompanionStamp] = useState(true);
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderPlan, setOrderPlan] = useState<'standard' | 'premium'>('standard');
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [recipientName, setRecipientName] = useState('');
  const [address, setAddress] = useState('');
  const [assignedSerial, setAssignedSerial] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [isDigitalIssued, setIsDigitalIssued] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Mock Trial Status (Ideally fetched from Supabase profiles.trial_ends_at)
  const isTrialActive = true; 

  useEffect(() => {
    if (isOpen && island) {
      const today = new Date();
      const dateStr = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;
      setVisitDate(dateStr);
      setTravelerName(contextTravelerName || user?.email?.split('@')[0] || '島旅トラベラー');
      setIsOrdering(false);
      setOrderSuccess(false);
      setErrorMessage(null);
      setUploadError(null);
      setAssignedSerial(getFormattedSerial(island.id || island.name));
      // In a real app, check if user already paid for this island's certificate
      setIsDigitalIssued(false);
    }
  }, [isOpen, island, user, contextTravelerName]);

  const handleOrderSubmit = async () => {
    if (!recipientName.trim() || !address.trim()) {
      setErrorMessage('お届け先お名前とご住所を入力してください。');
      return;
    }
    setErrorMessage(null);
    setOrderSubmitting(true);
    try {
      const res = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: orderPlan,
          travelerName,
          recipientName,
          address,
          islandId: island?.id,
          islandName: island?.name,
          visitDate,
          userId: user?.id
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOrderNumber(data.orderNumber || 'ORD-2026-0001');
        if (data.serialNumber) setAssignedSerial(data.serialNumber);
        setOrderSuccess(true);
      } else {
        setErrorMessage(data.error || '注文受付中にエラーが発生しました。');
      }
    } catch (e) {
      console.error(e);
      setErrorMessage('通信エラーが発生しました。');
    } finally {
      setOrderSubmitting(false);
    }
  };

  // Handle Photo Upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setUploadError('ファイルサイズは5MB以下にしてください');
        return;
      }
      setUploadError(null);
      const reader = new FileReader();
      reader.onload = (event) => {
        setCustomImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Draw Certificate to Canvas
  const drawCertificate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !island) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions (4:3 landscape ratio, high res)
    const width = 1200;
    const height = 900;
    canvas.width = width;
    canvas.height = height;

    const renderContent = (heroImg?: HTMLImageElement) => {
      // Background fill
      ctx.fillStyle = '#0F172A'; // Slate 900
      ctx.fillRect(0, 0, width, height);

      // Subtle radial glow
      const gradient = ctx.createRadialGradient(width / 2, height / 2, 100, width / 2, height / 2, 800);
      gradient.addColorStop(0, '#1E293B');
      gradient.addColorStop(1, '#0F172A');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Outer Gold Border
      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 12;
      ctx.strokeRect(30, 30, width - 60, height - 60);

      // Inner Gold Fine Border
      ctx.lineWidth = 2;
      ctx.strokeRect(46, 46, width - 92, height - 92);

      // Corner Ornaments
      const drawCorner = (x: number, y: number, dx: number, dy: number) => {
        ctx.beginPath();
        ctx.moveTo(x, y + dy * 30);
        ctx.lineTo(x, y);
        ctx.lineTo(x + dx * 30, y);
        ctx.strokeStyle = '#F3E5AB';
        ctx.lineWidth = 4;
        ctx.stroke();
      };
      drawCorner(46, 46, 1, 1);
      drawCorner(width - 46, 46, -1, 1);
      drawCorner(46, height - 46, 1, -1);
      drawCorner(width - 46, height - 46, -1, -1);

      // Header Title
      ctx.fillStyle = '#F3E5AB';
      ctx.font = 'bold 24px serif';
      ctx.textAlign = 'center';
      ctx.fillText('KIRATABI OFFICIAL RECORD OF ARRIVAL', width / 2, 110);

      ctx.fillStyle = '#D4AF37';
      ctx.font = 'light 48px serif';
      ctx.fillText('島 旅 到 達 認 定 証', width / 2, 175);

      // Decorative Line
      ctx.beginPath();
      ctx.moveTo(width / 2 - 200, 205);
      ctx.lineTo(width / 2 + 200, 205);
      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Body Text
      ctx.fillStyle = '#E2E8F0';
      ctx.font = '28px sans-serif';
      ctx.fillText('以下の旅人が日本諸島を巡る旅において、', width / 2, 270);
      ctx.fillText('見事この地を踏破・到達したことをここに公式に証明する。', width / 2, 315);

      // Traveler Name Highlight Box
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fillRect(width / 2 - 350, 350, 700, 80);
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
      ctx.lineWidth = 1;
      ctx.strokeRect(width / 2 - 350, 350, 700, 80);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 44px serif';
      ctx.fillText(travelerName || 'Voyager', width / 2, 405);

      // Island Name & Region & Difficulty
      const diff = getIslandDifficulty(island);
      ctx.fillStyle = '#D4AF37';
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText(`【 到達島 】 ${island.name} (${island.region_id || 'Japan'})`, width / 2, 475);

      ctx.fillStyle = '#F59E0B';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText(`【 冒険難易度 】 ${diff.stars} (${diff.shortLabel})`, width / 2, 515);

      // Date
      ctx.fillStyle = '#94A3B8';
      ctx.font = '22px monospace';
      ctx.fillText(`DATE OF ARRIVAL: ${visitDate}`, width / 2, 555);

      // Hero Image Area
      if (heroImg) {
        ctx.save();
        const heroX = width / 2 - 220;
        const heroY = 585;
        const heroW = 440;
        const heroH = 190;

        ctx.beginPath();
        ctx.rect(heroX, heroY, heroW, heroH);
        ctx.clip();

        const scale = Math.max(heroW / heroImg.width, heroH / heroImg.height);
        const dw = heroImg.width * scale;
        const dh = heroImg.height * scale;
        const dx = heroX + (heroW - dw) / 2;
        const dy = heroY + (heroH - dh) / 2;
        ctx.drawImage(heroImg, dx, dy, dw, dh);
        ctx.restore();

        ctx.strokeStyle = '#D4AF37';
        ctx.lineWidth = 3;
        ctx.strokeRect(heroX, heroY, heroW, heroH);
      }

      // Draw Stamp / Seal (Bottom Right)
      const centerX = width - 180;
      const centerY = height - 180;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 65, 0, Math.PI * 2);
      ctx.strokeStyle = '#E11D48'; // Official Red Seal color
      ctx.lineWidth = 5;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(centerX, centerY, 57, 0, Math.PI * 2);
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#E11D48';
      ctx.font = 'bold 18px serif';
      ctx.fillText('輝旅公認', centerX, centerY - 15);
      ctx.font = 'bold 22px serif';
      ctx.fillText('到達証明', centerX, centerY + 15);
      ctx.font = '14px monospace';
      ctx.fillText('VERIFIED', centerX, centerY + 38);

      // Draw Companion Character Stamp & Emblem Box (Bottom Left/Center) if checked
      if (includeCompanionStamp && companionChar && companionStage) {
        ctx.save();
        const compX = 80;
        const compY = height - 195;
        const compW = 420;
        const compH = 88;

        // Background box
        ctx.fillStyle = 'rgba(30, 41, 59, 0.9)';
        ctx.fillRect(compX, compY, compW, compH);
        ctx.strokeStyle = '#D4AF37';
        ctx.lineWidth = 2;
        ctx.strokeRect(compX, compY, compW, compH);

        // Character Icon circle
        ctx.beginPath();
        ctx.arc(compX + 44, compY + 44, 30, 0, Math.PI * 2);
        ctx.fillStyle = '#0F172A';
        ctx.fill();
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.font = '32px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(companionStage.icon || '🐢', compX + 44, compY + 54);

        // Character Texts
        ctx.textAlign = 'left';
        ctx.fillStyle = '#F3E5AB';
        ctx.font = 'bold 15px sans-serif';
        ctx.fillText(`同行精霊: ${companionChar.name} (STAGE ${companionStage.stage})`, compX + 88, compY + 28);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 17px serif';
        ctx.fillText(`${companionStage.name}`, compX + 88, compY + 52);

        ctx.fillStyle = '#38BDF8';
        ctx.font = '12px monospace';
        ctx.fillText(`【 守護精霊パートナー公式認定証 】`, compX + 88, compY + 74);
        ctx.restore();
      }

      // Draw Serial Number (Bottom Left)
      const serialText = assignedSerial || getFormattedSerial(island.id || island.name);
      ctx.fillStyle = '#64748B';
      ctx.font = '18px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`SERIAL: ${serialText}`, 80, height - 80);
      ctx.fillText(`VERIFY AT: https://travelappv2-two.vercel.app`, 80, height - 55);
    };

    renderContent();

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      renderContent(img);
    };
    img.onerror = () => {
      // Keep canvas with default drawn content if image fails
    };
    img.src = customImage || island?.image_url || '/placeholders/trop.jpg';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [island, travelerName, visitDate, customImage, assignedSerial]);

  useEffect(() => {
    if (!isOpen || !island) return;
    const timer = setTimeout(() => {
      drawCertificate();
    }, 300);
    return () => clearTimeout(timer);
  }, [isOpen, island, drawCertificate]);

  // Handle Download
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `KIRATABI_Certificate_${island?.name || 'Island'}.png`;
    link.href = dataUrl;
    link.click();
  };

  // Handle X (Twitter) Share
  const handleShareX = () => {
    const text = `【島旅到達証明書を獲得！】\n日本の離島「${island?.name}」に到達しました🏝️✨\n全国432島制覇に向けて挑戦中！\n\n#KIRATABI #島専科 #${island?.name} #離島旅`;
    const url = `https://travelappv2-two.vercel.app/island/${island?.id}`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, '_blank');
  };

  if (!isOpen || !island) return null;

  if (!isVerified) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 lg:p-8"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden bg-white"
          >
            <div className="bg-slate-100 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-700">到達記録</h3>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 text-center">
              <div className="w-24 h-24 mx-auto bg-blue-50 rounded-full flex items-center justify-center mb-4">
                {companionChar ? (
                  <span className="text-4xl">{companionStage?.icon || '🦉'}</span>
                ) : (
                  <CheckCircle className="w-12 h-12 text-blue-400" />
                )}
              </div>
              <h4 className="font-serif font-bold text-xl text-slate-800 mb-2">「{island.name}」<br/>自己申告記録完了！</h4>
              <p className="text-sm text-slate-500 mb-6">
                簡易到達記録を保存しました。到達率がアップします！
              </p>
              
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold text-amber-800">公式認定でさらに豪華に！</span>
                </div>
                <p className="text-xs text-amber-700 leading-relaxed">
                  現地での写真(GPS付)やGPSチェックインを行うと、<strong className="text-amber-900">ポイント獲得</strong>や<strong className="text-amber-900">高画質な公式証明書</strong>の発行が可能になります！
                </p>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100">
              <button onClick={onClose} className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition-colors">
                閉じる
              </button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-4 lg:p-8 overflow-y-auto"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className={`w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
            isVerified ? 'bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200' : 'bg-slate-800 border border-slate-700'
          }`}
        >
          {/* Inject AuthModal just in case they need to login */}
          {/* Note: We need to import AuthModal at the top, but we can do it inline or assume it's available via context, 
              actually it's better to just prompt them to close and login via the top right, but let's render a simple message */}
          {/* Modal Header */}
          <div className={`flex items-center justify-between px-6 py-4 border-b sticky top-0 z-10 ${
            isVerified ? 'bg-amber-100/80 border-amber-200' : 'border-slate-700 bg-slate-800/80'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isVerified ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              }`}>
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`font-serif font-bold text-lg ${isVerified ? 'text-amber-900' : 'text-white'}`}>
                  {isVerified ? '公式認定到達証明書' : '公式到達証明書の発行'}
                </h3>
                <p className={`text-xs tracking-wider ${isVerified ? 'text-amber-700/70' : 'text-slate-400'}`}>
                  KIRATABI OFFICIAL ARRIVAL CERTIFICATE
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-full transition-colors ${isVerified ? 'text-amber-900/60 hover:text-amber-900' : 'text-slate-400 hover:text-white'}`}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto space-y-8 flex-1">
            
            {!isOrdering ? (
              <>
                {/* Customizer Inputs */}
                <div className="space-y-4 bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-amber-400" /> 旅人ネーム (証明書に印字)
                      </label>
                      <input
                        type="text"
                        value={travelerName}
                        onChange={(e) => {
                          setTravelerName(e.target.value);
                          updateTravelerName(e.target.value);
                        }}
                        placeholder="お名前またはハンドルネーム"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-amber-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-amber-400" /> 到達日
                      </label>
                      <input
                        type="text"
                        value={visitDate}
                        onChange={(e) => setVisitDate(e.target.value)}
                        placeholder="YYYY.MM.DD"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-amber-500 transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-amber-400" /> カスタム写真アップロード (ヒーローエリアに反映)
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="w-full text-xs text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-amber-400 hover:file:bg-slate-700 transition-all"
                      />
                      {customImage && (
                        <button
                          type="button"
                          onClick={() => setCustomImage(null)}
                          className="text-xs text-rose-400 hover:text-rose-300 underline shrink-0"
                        >
                          削除
                        </button>
                      )}
                    </div>
                    {uploadError && (
                      <p className="text-xs text-rose-400 mt-1 font-semibold">{uploadError}</p>
                    )}
                    
                    {/* 守護精霊パートナー刻印チェックボックス */}
                    {companionChar && companionStage && (
                      <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between">
                        <label className="flex items-center gap-2.5 cursor-pointer select-none text-xs text-slate-300 hover:text-white transition-colors">
                          <input
                            type="checkbox"
                            checked={includeCompanionStamp}
                            onChange={(e) => setIncludeCompanionStamp(e.target.checked)}
                            className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-slate-800 border-slate-600"
                          />
                          <span className="font-bold text-amber-400 flex items-center gap-1.5">
                            <span>{companionStage.icon}</span>
                            <span>同行精霊「{companionChar.name} (STAGE {companionStage.stage})」を認定証＆公式カードに刻印する</span>
                          </span>
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {/* Canvas Preview Box */}
                <div className="flex flex-col items-center relative">
                  <p className="text-xs text-slate-400 mb-3 tracking-widest uppercase flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" /> 証明書プレビュー (リアルタイム反映)
                  </p>
                  <div className="w-full bg-slate-950 p-3 rounded-2xl border border-slate-700/60 shadow-inner overflow-hidden flex justify-center relative">
                    <canvas
                      ref={canvasRef}
                      className={`w-full max-w-[640px] h-auto rounded-lg shadow-2xl border border-slate-800 transition-all duration-1000 ${!isDigitalIssued ? 'blur-sm grayscale opacity-80' : ''}`}
                    />
                    {!isDigitalIssued && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/40 backdrop-blur-sm z-10 p-6 rounded-2xl">
                        {!user ? (
                          <div className="bg-white p-6 rounded-2xl shadow-xl text-center max-w-sm">
                            <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <h4 className="font-bold text-slate-800 mb-2">ログインが必要です</h4>
                            <p className="text-xs text-slate-500 mb-4">公式認定デジタル証明書を発行・保存するには、無料のユーザー登録が必要です。</p>
                            <p className="text-xs font-bold text-rose-600 mb-4 animate-pulse">【特典】今登録すると3ヶ月間発行無料！</p>
                            <button onClick={onClose} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl">
                              閉じてログイン画面へ
                            </button>
                          </div>
                        ) : isTrialActive ? (
                          <div className="bg-white p-6 rounded-2xl shadow-xl text-center max-w-sm border-2 border-amber-400">
                            <Sparkles className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                            <h4 className="font-bold text-slate-800 mb-2 font-serif text-lg">簡易デジタル版を発行</h4>
                            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                              この島の公式認定デジタル証明書を発行し、透かしを解除してダウンロード可能にします。
                            </p>
                            <div className="bg-rose-50 text-rose-600 font-bold text-xs p-3 rounded-xl mb-4 border border-rose-200">
                              【登録から3ヶ月限定トライアル期間中】<br/>
                              各島で1枚まで<span className="text-sm"> 無料 </span>で発行できます！
                            </div>
                            <button 
                              onClick={() => setIsDigitalIssued(true)}
                              className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-900 font-bold text-sm rounded-xl shadow-lg"
                            >
                              無料で公式証明書を発行する
                            </button>
                          </div>
                        ) : (
                          <div className="bg-white p-6 rounded-2xl shadow-xl text-center max-w-sm border border-slate-200">
                            <Award className="w-12 h-12 text-blue-500 mx-auto mb-3" />
                            <h4 className="font-bold text-slate-800 mb-2 font-serif text-lg">簡易デジタル版を発行</h4>
                            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                              無料トライアル期間が終了しました。公式認定デジタル証明書の発行には決済が必要です。
                            </p>
                            <button 
                              onClick={() => setIsDigitalIssued(true)}
                              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl shadow-lg flex items-center justify-center gap-2"
                            >
                              <span>Stripe決済へ進む</span>
                              <span className="bg-slate-700 px-2 py-0.5 rounded text-xs">¥100</span>
                            </button>
                            <p className="text-[10px] text-slate-400 mt-3">※テスト環境のため実際には課金されません</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Viral & Free Download Actions */}
                <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 transition-all duration-500 ${!isDigitalIssued ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                  <button
                    onClick={handleShareX}
                    className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-sm tracking-widest flex items-center justify-center gap-2 shadow-lg hover:shadow-sky-500/25 transition-all"
                  >
                    <Share2 className="w-4 h-4" />
                    X(Twitter)でシェアして自慢する
                  </button>
                  <button
                    onClick={handleDownload}
                    className="w-full py-4 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm tracking-widest flex items-center justify-center gap-2 shadow-lg hover:shadow-amber-500/25 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    デジタル画像DL (無料)
                  </button>
                </div>

                {/* Monetization Banner (Physical Mail Order) */}
                <div className="mt-6 bg-gradient-to-br from-amber-500/10 via-slate-800 to-amber-500/5 p-6 rounded-3xl border border-amber-500/30 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="space-y-1 text-center md:text-left">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold tracking-wider mb-1">
                      <Sparkles className="w-3.5 h-3.5" /> オフィシャル郵送オーダー
                    </div>
                    <h4 className="font-serif font-bold text-white text-lg">世界にひとつだけの紙証明書をお手元へ</h4>
                    <p className="text-xs text-slate-300 leading-relaxed max-w-md">
                      高品質な厚紙・金箔押し調の印刷仕上げで、ご自宅やオフィスに飾れるオフィシャル紙証明書を郵送いたします。
                    </p>
                  </div>
                  <button
                    onClick={() => setIsOrdering(true)}
                    className="shrink-0 px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-bold text-sm tracking-wider shadow-xl transition-all hover:scale-105"
                  >
                    郵送オーダーを申し込む →
                  </button>
                </div>
              </>
            ) : (
              /* Physical Mail Order Flow */
              <div className="space-y-6 max-w-xl mx-auto py-4">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setIsOrdering(false)}
                    className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                  >
                    ← プレビューに戻る
                  </button>
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Physical Certificate Order</span>
                </div>

                {!orderSuccess ? (
                  <div className="space-y-6 bg-slate-900/60 p-6 rounded-3xl border border-slate-700">
                    <h4 className="font-serif font-bold text-white text-xl text-center">プラン選択と配送先入力</h4>

                    <div className="grid grid-cols-2 gap-4">
                      <div
                        onClick={() => setOrderPlan('standard')}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                          orderPlan === 'standard' ? 'border-amber-500 bg-amber-500/10' : 'border-slate-700 bg-slate-800'
                        }`}
                      >
                        <span className="text-xs font-bold text-amber-400 block mb-1">スタンダード版</span>
                        <div className="text-lg font-bold text-white mb-2">¥600 <span className="text-xs font-normal text-slate-400">(税込・送料込)</span></div>
                        <p className="text-xs text-slate-300 leading-relaxed">ハガキサイズ・上質厚紙カード仕様。記念保管やプレゼントに最適。</p>
                      </div>
                      <div
                        onClick={() => setOrderPlan('premium')}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                          orderPlan === 'premium' ? 'border-amber-500 bg-amber-500/10' : 'border-slate-700 bg-slate-800'
                        }`}
                      >
                        <span className="text-xs font-bold text-amber-400 block mb-1">プレミアム額装版</span>
                        <div className="text-lg font-bold text-white mb-2">¥2,000 <span className="text-xs font-normal text-slate-400">(税込・送料込)</span></div>
                        <p className="text-xs text-slate-300 leading-relaxed">A4大判高級証書紙仕様。部屋や店頭に飾れるオフィシャル証書。</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1">お届け先お名前</label>
                        <input 
                          type="text" 
                          value={recipientName}
                          onChange={e => setRecipientName(e.target.value)}
                          placeholder="山田 太郎" 
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-amber-500" 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1">郵便番号・ご住所</label>
                        <input 
                          type="text" 
                          value={address}
                          onChange={e => setAddress(e.target.value)}
                          placeholder="〒100-0001 東京都千代田区..." 
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-amber-500" 
                        />
                      </div>
                    </div>

                    {errorMessage && (
                      <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
                        {errorMessage}
                      </div>
                    )}

                    <button
                      onClick={handleOrderSubmit}
                      disabled={orderSubmitting}
                      className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-bold text-sm tracking-widest shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                      {orderSubmitting ? '処理中...' : '決済へ進む (Stripeデモ / 連番シリアル確定)'}
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-12 space-y-4 bg-slate-900/60 p-8 rounded-3xl border border-emerald-500/30">
                    <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto animate-bounce" />
                    <h4 className="font-serif font-bold text-white text-2xl">ご注文受付完了！</h4>
                    <p className="text-slate-300 text-sm leading-relaxed max-w-md mx-auto">
                      「{island.name}」の到達証明書のオーダーおよび連番シリアル発行が確定いたしました。ご指定住所宛に約3〜5営業日で発送いたします。
                    </p>
                    <div className="bg-slate-800/80 border border-amber-500/40 rounded-2xl p-4 max-w-sm mx-auto text-left space-y-2 my-4">
                      <div className="text-xs text-slate-400 flex justify-between">
                        <span>受付番号:</span>
                        <strong className="text-amber-400 font-mono">{orderNumber || 'ORD-2026-0001'}</strong>
                      </div>
                      <div className="text-xs text-slate-400 flex justify-between">
                        <span>公認シリアルNo:</span>
                        <strong className="text-emerald-400 font-mono">{assignedSerial}</strong>
                      </div>
                    </div>
                    <button
                      onClick={onClose}
                      className="mt-4 px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm rounded-xl border border-slate-700 transition-colors"
                    >
                      閉じる
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
