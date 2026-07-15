'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Share2, Award, Camera, CheckCircle, Sparkles, Send, MapPin, Calendar, User } from 'lucide-react';

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  island: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user?: any;
}

export default function CertificateModal({ isOpen, onClose, island, user }: CertificateModalProps) {
  const [travelerName, setTravelerName] = useState<string>('');
  const [visitDate, setVisitDate] = useState<string>('');
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderPlan, setOrderPlan] = useState<'standard' | 'premium'>('standard');
  const [orderSuccess, setOrderSuccess] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isOpen) {
      const today = new Date();
      const dateStr = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;
      setVisitDate(dateStr);
      setTravelerName(user?.email?.split('@')[0] || 'Voyager');
      setIsOrdering(false);
      setOrderSuccess(false);
    }
  }, [isOpen, user]);

  // Handle Photo Upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCustomImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Draw Certificate to Canvas
  const drawCertificate = () => {
    const canvas = canvasRef.current;
    if (!canvas || !island) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions (4:3 landscape ratio, high res)
    const width = 1200;
    const height = 900;
    canvas.width = width;
    canvas.height = height;

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

    // Island Name & Region
    ctx.fillStyle = '#D4AF37';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText(`【 到達島 】 ${island.name} (${island.region_id || 'Japan'})`, width / 2, 490);

    // Date
    ctx.fillStyle = '#94A3B8';
    ctx.font = '24px monospace';
    ctx.fillText(`DATE OF ARRIVAL: ${visitDate}`, width / 2, 540);

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

    // Draw Serial Number (Bottom Left)
    ctx.fillStyle = '#64748B';
    ctx.font = '18px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`SERIAL: KT-${island.id?.toUpperCase() || 'ISL'}-${Math.floor(100000 + Math.random() * 900000)}`, 80, height - 80);
    ctx.fillText(`VERIFY AT: https://travelappv2-two.vercel.app`, 80, height - 55);
  };

  useEffect(() => {
    if (isOpen && island) {
      setTimeout(drawCertificate, 100);
    }
  }, [isOpen, island, travelerName, visitDate]);

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
          className="bg-slate-800 border border-slate-700 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-slate-800/80 sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-white">公式到達証明書の発行</h3>
                <p className="text-xs text-slate-400 tracking-wider">KIRATABI OFFICIAL ARRIVAL CERTIFICATE</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto space-y-8 flex-1">
            
            {!isOrdering ? (
              <>
                {/* Customizer Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-amber-400" /> 旅人ネーム (証明書に印字)
                    </label>
                    <input
                      type="text"
                      value={travelerName}
                      onChange={(e) => setTravelerName(e.target.value)}
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

                {/* Canvas Preview Box */}
                <div className="flex flex-col items-center">
                  <p className="text-xs text-slate-400 mb-3 tracking-widest uppercase flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" /> 証明書プレビュー (リアルタイム反映)
                  </p>
                  <div className="w-full bg-slate-950 p-3 rounded-2xl border border-slate-700/60 shadow-inner overflow-hidden flex justify-center">
                    <canvas
                      ref={canvasRef}
                      className="w-full max-w-[640px] h-auto rounded-lg shadow-2xl border border-slate-800"
                    />
                  </div>
                </div>

                {/* Viral & Free Download Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
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
                        <input type="text" placeholder="山田 太郎" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1">郵便番号・ご住所</label>
                        <input type="text" placeholder="〒100-0001 東京都千代田区..." className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white text-sm" />
                      </div>
                    </div>

                    <button
                      onClick={() => setOrderSuccess(true)}
                      className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-bold text-sm tracking-widest shadow-lg flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      決済へ進む (Stripeデモ)
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-12 space-y-4 bg-slate-900/60 p-8 rounded-3xl border border-emerald-500/30">
                    <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto" />
                    <h4 className="font-serif font-bold text-white text-2xl">お申し込みありがとうございます！</h4>
                    <p className="text-slate-300 text-sm leading-relaxed max-w-md mx-auto">
                      「{island.name}」の到達証明書のオーダーを受付いたしました。
                      ご指定の住所宛に約3〜5営業日で発送いたします。
                    </p>
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
