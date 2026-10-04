'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Wifi, Copy, Check, QrCode, Smartphone, Info, 
  HelpCircle, Sparkles, ShieldCheck, ExternalLink, ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';

interface WifiConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  facilityName: string;
  ssid: string;
  password?: string;
  encryption?: 'WPA' | 'WEP' | 'nopass';
  notes?: string;
}

export default function WifiConnectModal({
  isOpen,
  onClose,
  facilityName,
  ssid,
  password = '',
  encryption = 'WPA',
  notes
}: WifiConnectModalProps) {
  const [copiedType, setCopiedType] = useState<'ssid' | 'password' | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  if (!isOpen) return null;

  // 国際標準 Wi-Fi 接続文字列フォーマット (iOS/Android標準対応)
  // WIFI:S:<SSID>;T:<WPA|WEP|nopass>;P:<PASSWORD>;;
  const wifiQrString = `WIFI:S:${ssid};T:${encryption};P:${password};;`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&margin=10&data=${encodeURIComponent(wifiQrString)}`;

  const handleCopy = async (type: 'ssid' | 'password') => {
    const textToCopy = type === 'ssid' ? ssid : password;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedType(type);
      toast.success(
        type === 'password'
          ? 'パスワードをコピーしました！Wi-Fi設定画面で貼り付けてください'
          : 'Wi-Fi名（SSID）をコピーしました！',
        { icon: '📋', duration: 3500 }
      );
      setTimeout(() => setCopiedType(null), 2500);
    } catch {
      toast.error('コピーに失敗しました。手動で長押しコピーしてください。');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 my-8 text-slate-800"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-6 py-5 text-white relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition"
              aria-label="閉じる"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold tracking-wider uppercase flex items-center gap-1">
                <Wifi className="w-3 h-3" />
                SMART WI-FI CONNECT
              </span>
            </div>
            <h3 className="text-xl font-black tracking-tight">{facilityName}</h3>
            <p className="text-xs text-white/90 font-medium mt-0.5">
              客室・館内フリーWi-Fi（ワンタップ接続）
            </p>
          </div>

          <div className="p-6 space-y-6">
            {/* 1. 国際標準 Wi-Fi QRコード */}
            <div className="flex flex-col items-center justify-center text-center p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
              <div className="relative p-3 bg-white rounded-2xl shadow-sm border border-slate-200">
                <img
                  src={qrImageUrl}
                  alt="Wi-Fi接続用QRコード"
                  className="w-44 h-44 object-contain rounded-lg"
                  loading="lazy"
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-10 h-10 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shadow-md">
                    <Wifi className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>

              <div className="mt-3 space-y-1">
                <p className="text-xs font-bold text-slate-800 flex items-center justify-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  スマホのカメラをかざすだけで即接続！
                </p>
                <p className="text-[11px] text-slate-500 leading-tight">
                  標準カメラを向けると接続通知が出ます。タップして「接続」で完了！
                </p>
              </div>
            </div>

            {/* 2. SSID & パスワード ワンタップコピー */}
            <div className="space-y-3">
              {/* SSID */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    ネットワーク名（SSID）
                  </span>
                  <span className="font-mono font-bold text-sm text-slate-800 truncate block select-all">
                    {ssid}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy('ssid')}
                  className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                    copiedType === 'ssid'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                  }`}
                >
                  {copiedType === 'ssid' ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      コピー済
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      コピー
                    </>
                  )}
                </button>
              </div>

              {/* パスワード */}
              {password ? (
                <div className="p-3.5 bg-emerald-50/60 border border-emerald-200/80 rounded-xl flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                      暗証番号（パスワード）
                    </span>
                    <span className="font-mono font-black text-base text-emerald-950 truncate block select-all">
                      {password}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy('password')}
                    className={`px-3.5 py-2.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 shrink-0 shadow-sm ${
                      copiedType === 'password'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    {copiedType === 'password' ? (
                      <>
                        <Check className="w-4 h-4" />
                        コピー完了！
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        パスワードをコピー
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
                  <span className="text-xs font-bold text-amber-800">
                    パスワード不要（オープンネットワーク）
                  </span>
                </div>
              )}
            </div>

            {/* 補足ノート */}
            {notes && (
              <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl flex items-start gap-2 text-xs text-slate-600">
                <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">{notes}</p>
              </div>
            )}

            {/* 3. 接続手順ガイド アコーディオン */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setShowGuide(!showGuide)}
                className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs font-bold text-slate-700 transition"
              >
                <span className="flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-slate-500" />
                  うまく繋がらない・接続方法を見る
                </span>
                <span className="text-[10px] text-slate-400">
                  {showGuide ? '閉じる ▲' : '開く ▼'}
                </span>
              </button>

              {showGuide && (
                <div className="p-4 bg-white space-y-3 text-xs text-slate-600 border-t border-slate-200">
                  <div className="space-y-1">
                    <p className="font-bold text-slate-800">📱 iPhone (iOS) の場合:</p>
                    <p className="text-slate-600 leading-relaxed">
                      標準の「カメラ」アプリを開いて上記QRコードを映すと、画面上部に「ネットワーク {ssid} に接続」とバナーが出ます。タップして「接続」を押すだけで完了です。
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-slate-800">🤖 Android の場合:</p>
                    <p className="text-slate-600 leading-relaxed">
                      標準カメラまたは「Google レンズ」でQRコードを読み取ると、「ネットワークに接続」ボタンが表示されます。
                    </p>
                  </div>
                  <div className="space-y-1 pt-1 border-t border-slate-100">
                    <p className="font-bold text-slate-800">💡 この画面を開いている端末自身を接続する場合:</p>
                    <p className="text-slate-600 leading-relaxed">
                      上の「パスワードをコピー」をタップ後、端末の「設定」→「Wi-Fi」を開き、一覧から『{ssid}』を選んでパスワードを貼り付けてください。
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* 閉じるボタン */}
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition"
            >
              閉じる
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
