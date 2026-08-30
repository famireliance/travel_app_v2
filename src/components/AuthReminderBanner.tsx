'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useTravel } from '@/context/TravelContext';
import { Cloud, X, ChevronRight } from 'lucide-react';
import AuthModal from './AuthModal';

export default function AuthReminderBanner() {
  const { user, isDataLoaded } = useTravel();
  const pathname = usePathname();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [hasLoggedInBefore, setHasLoggedInBefore] = useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const loggedInBefore = localStorage.getItem('kiratabi_has_logged_in_before') === 'true';
      setHasLoggedInBefore(loggedInBefore);
    }
  }, []);

  // If user is logged in, banner was dismissed, or on map page, don't show
  if (!isDataLoaded || user || isDismissed || pathname === '/map') return null;

  return (
    <>
      <div className="bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-md relative z-[60]">
        <div className="max-w-4xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 flex-1 cursor-pointer" onClick={() => setIsAuthOpen(true)}>
            <Cloud className="w-5 h-5 shrink-0 text-sky-200" />
            <div>
              <p className="text-[10px] md:text-xs font-bold tracking-widest text-sky-100 uppercase">Guest Mode</p>
              {hasLoggedInBefore ? (
                <p className="text-xs md:text-sm font-bold text-yellow-300 leading-tight">
                  ⚠️ ログイン有効期限が切れています。記録を引き継ぐには再度ログインしてください。
                </p>
              ) : (
                <p className="text-xs md:text-sm font-medium leading-tight">
                  無料ユーザー登録で、妖精コレクションをクラウド保存！ <strong className="text-yellow-300">今なら公式証明書が3ヶ月無料！</strong>
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button 
              onClick={() => setIsAuthOpen(true)}
              className="hidden md:flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-full text-xs font-bold transition-colors"
            >
              {hasLoggedInBefore ? 'ログインする' : '登録する'} <ChevronRight className="w-3 h-3" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); setIsDismissed(true); }}
              className="p-1.5 rounded-full hover:bg-white/20 text-sky-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
}
