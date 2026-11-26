'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Download, Share, Smartphone, WifiOff, X } from 'lucide-react';
import { getOfflineCheckins } from '@/lib/offlineSync';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const PWA_DISMISS_KEY = 'kiratabi_pwa_prompt_dismissed_v1';

export default function PwaOfflineBanner() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [showInstallBar, setShowInstallBar] = useState(false);
  const [showIosGuideModal, setShowIosGuideModal] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  const isRestrictedPortal =
    pathname?.startsWith('/kira-system-panel-9f2') ||
    pathname?.startsWith('/biz-portal-secure-8f92a1b3') ||
    (typeof window !== 'undefined' &&
      (window.location.hostname.startsWith('ops-vault-') ||
        window.location.hostname.startsWith('partner.') ||
        window.location.hostname.startsWith('biz.')));

  const refreshOfflineStatus = useCallback(async () => {
    if (typeof window === 'undefined') return;
    setIsOnline(navigator.onLine);
    try {
      const items = await getOfflineCheckins();
      setPendingCount(items.length);
    } catch {
      // ignore IndexedDB read errors
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || isRestrictedPortal) return;
    setMounted(true);

    // Register Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    refreshOfflineStatus();

    const handleOnline = () => {
      refreshOfflineStatus();
      setTimeout(refreshOfflineStatus, 2500);
    };
    const handleOffline = () => refreshOfflineStatus();
    const handleFocus = () => refreshOfflineStatus();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') refreshOfflineStatus();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    const pollTimer = setInterval(() => {
      if (!navigator.onLine) {
        refreshOfflineStatus();
      }
    }, 6000);

    // Check mobile standalone mode & install prompt dismissal
    const isStandalone =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window.navigator as any).standalone === true;

    let dismissed = false;
    try {
      dismissed = localStorage.getItem(PWA_DISMISS_KEY) === '1';
    } catch {
      dismissed = false;
    }

    const isMobileDevice =
      window.innerWidth < 768 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (!isStandalone && !dismissed && isMobileDevice) {
      setShowInstallBar(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (!isStandalone && !dismissed && isMobileDevice) {
        setShowInstallBar(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearInterval(pollTimer);
    };
  }, [isRestrictedPortal, refreshOfflineStatus]);

  if (!mounted || isRestrictedPortal) return null;

  const handleDismissInstallBar = () => {
    setShowInstallBar(false);
    try {
      localStorage.setItem(PWA_DISMISS_KEY, '1');
    } catch {
      // ignore Safari Private Mode
    }
  };

  const handleInstallAction = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setShowInstallBar(false);
          try {
            localStorage.setItem(PWA_DISMISS_KEY, '1');
          } catch {}
        }
        setDeferredPrompt(null);
        return;
      } catch {
        // Fallback to manual guide modal
      }
    }
    setShowIosGuideModal(true);
  };

  const hideInstallOnFullMap = pathname === '/map' || pathname?.startsWith('/globe');
  const hasBottomNavOnHome = pathname === '/';

  return (
    <>
      {/* 1. Offline Protection / Pending Check-in Sync Status Bar */}
      <AnimatePresence>
        {(!isOnline || pendingCount > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            className={`sticky top-0 z-[9990] w-full px-4 py-2 text-xs font-bold flex flex-wrap items-center justify-center gap-x-3 gap-y-1 shadow-lg border-b ${
              !isOnline
                ? 'bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 text-amber-200 border-amber-500/40'
                : 'bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 text-emerald-200 border-emerald-500/40'
            }`}
          >
            <span className="inline-flex items-center gap-1.5">
              <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{!isOnline ? '📡 オフライン保護モード稼働中' : '📶 電波復帰・自動同期中'}</span>
            </span>
            <span className="text-slate-400 hidden sm:inline">｜</span>
            <span className="text-[11px] sm:text-xs text-white/90">
              未同期の現地チェックイン: <strong className="text-amber-300">{pendingCount}件</strong>
              （電波復帰で自動保存されます）
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Dismissible Mobile PWA Home-Screen Install Bar */}
      <AnimatePresence>
        {showInstallBar && !hideInstallOnFullMap && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            className={`md:hidden fixed left-3 right-3 z-[90] ${
              hasBottomNavOnHome
                ? 'bottom-[calc(76px+env(safe-area-inset-bottom))]'
                : 'bottom-[calc(14px+env(safe-area-inset-bottom))]'
            }`}
          >
            <div className="bg-slate-900/95 backdrop-blur-xl text-white border border-amber-400/40 rounded-2xl px-3.5 py-2.5 shadow-2xl flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300 shrink-0">
                  <Smartphone className="w-4 h-4" />
                </div>
                <p className="text-[11px] font-bold leading-snug text-slate-100 line-clamp-2">
                  📲 船上や電波の弱い離島でも安心！ホーム画面にアプリ追加
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleInstallAction}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-extrabold text-[11px] shadow whitespace-nowrap flex items-center gap-1"
                >
                  <Download className="w-3 h-3 shrink-0" />
                  <span>{deferredPrompt ? 'インストール' : '追加方法'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDismissInstallBar}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  aria-label="閉じる"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. iOS Safari / Mobile 2-Step Add-to-Home-Screen Guide Modal */}
      <AnimatePresence>
        {showIosGuideModal && (
          <div
            className="fixed inset-0 z-[10030] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setShowIosGuideModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-sm w-full text-white shadow-2xl space-y-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold tracking-widest uppercase text-amber-400">
                    OFFLINE GPS READY PWA
                  </span>
                  <h3 className="font-serif font-bold text-lg text-white mt-0.5">
                    📲 ホーム画面にアプリ追加（無料）
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIosGuideModal(false)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                ホーム画面に追加すると、フル画面アプリとして起動でき、フェリー船上や圏外の離島でもGPS到達記録を保護できます。
              </p>

              <div className="space-y-2.5 bg-slate-950/90 rounded-2xl p-4 border border-slate-800 text-xs">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-extrabold flex items-center justify-center shrink-0">
                    1
                  </span>
                  <p className="text-slate-200 leading-relaxed pt-0.5">
                    Safari画面下の{' '}
                    <strong className="text-amber-300 inline-flex items-center gap-0.5">
                      <Share className="w-3.5 h-3.5 inline" /> 共有（↑）
                    </strong>{' '}
                    ボタン（Androidは右上のメニュー ⋮）をタップ
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-400 text-slate-950 font-extrabold flex items-center justify-center shrink-0">
                    2
                  </span>
                  <p className="text-slate-200 leading-relaxed pt-0.5">
                    メニュー内の{' '}
                    <strong className="text-emerald-300">「ホーム画面に追加」</strong>{' '}
                    をタップして完了！
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowIosGuideModal(false);
                    handleDismissInstallBar();
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
                >
                  今後表示しない
                </button>
                <button
                  type="button"
                  onClick={() => setShowIosGuideModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs transition-colors"
                >
                  閉じる
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
