'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { LayoutDashboard, Store, CalendarCheck, LogOut, Loader2, BookOpen } from 'lucide-react';
import Link from 'next/link';

export default function BizPortalLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setSession(null);
        setLoading(false);
        if (!pathname.includes('/login')) {
          router.replace('/biz-portal-secure-8f92a1b3/login');
        }
        return;
      }

      // 認証済みの場合、Roleを厳格にチェック
      const { data: profile } = await supabase.from('user_profiles').select('role').eq('id', session.user.id).single();
      if (profile?.role !== 'owner' && profile?.role !== 'super_admin') {
        // 権限がない場合は強制ログアウトしてログイン画面へ
        await supabase.auth.signOut();
        setSession(null);
        setLoading(false);
        if (!pathname.includes('/login')) {
          router.replace('/biz-portal-secure-8f92a1b3/login');
        }
        return;
      }

      setSession(session);
      setLoading(false);
    }
    
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session) {
        setSession(null);
        if (!pathname.includes('/login')) {
          router.replace('/biz-portal-secure-8f92a1b3/login');
        }
      } else {
        // セッションが変更された場合もRoleチェックを行う
        const { data: profile } = await supabase.from('user_profiles').select('role').eq('id', session.user.id).single();
        if (profile?.role !== 'owner' && profile?.role !== 'super_admin') {
          await supabase.auth.signOut();
          setSession(null);
          if (!pathname.includes('/login')) {
            router.replace('/biz-portal-secure-8f92a1b3/login');
          }
        } else {
          setSession(session);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [pathname, router]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;
  }

  // もしログイン画面なら、ナビゲーションメニューを出さずにそのまま描画
  if (pathname.includes('/login')) {
    return <div className="min-h-screen bg-slate-50">{children}</div>;
  }

  if (!session) return null; // router.replace が効くまでのチラつき防止

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/biz-portal-secure-8f92a1b3/login');
  };

  const navItems = [
    { name: 'ダッシュボード', path: '/biz-portal-secure-8f92a1b3/dashboard', icon: LayoutDashboard },
    { name: '施設情報編集', path: '/biz-portal-secure-8f92a1b3/facility', icon: Store },
    { name: '予約管理', path: '/biz-portal-secure-8f92a1b3/reservations', icon: CalendarCheck },
    { name: 'オンライン宿泊台帳', path: '/biz-portal-secure-8f92a1b3/ledger', icon: BookOpen },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar (Desktop) / Bottom Nav (Mobile) */}
      <nav className="fixed bottom-0 w-full md:relative md:w-64 bg-slate-900 text-slate-300 z-50 md:min-h-screen shadow-xl pb-safe md:pb-0">
        <div className="hidden md:block p-6">
          <h1 className="text-white font-bold text-lg tracking-widest uppercase">Owner Portal</h1>
          <p className="text-xs text-slate-500 mt-1">KIRATABI B2B System</p>
        </div>
        
        <ul className="flex md:flex-col justify-around md:justify-start gap-1 p-2 md:p-4">
          {navItems.map(item => {
            const isActive = pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <li key={item.name} className="flex-1 md:flex-none">
                <Link href={item.path} className={`flex flex-col md:flex-row items-center gap-1 md:gap-3 p-3 md:px-4 md:py-3 rounded-xl transition-colors ${isActive ? 'bg-amber-500 text-slate-900 font-bold shadow-md' : 'hover:bg-slate-800 hover:text-white'}`}>
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] md:text-sm">{item.name}</span>
                </Link>
              </li>
            );
          })}
          
          <li className="hidden md:block mt-auto pt-8">
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-rose-950/50 hover:text-rose-400 transition-colors">
              <LogOut className="w-5 h-5" />
              <span className="text-sm">ログアウト</span>
            </button>
          </li>
        </ul>
      </nav>

      {/* Main Content */}
      <main className="flex-1 pb-20 md:pb-0 overflow-y-auto">
        {/* Mobile Header */}
        <header className="md:hidden bg-white px-4 py-3 border-b border-slate-200 flex items-center justify-between sticky top-0 z-40">
          <h1 className="font-bold text-slate-800 tracking-widest text-sm">OWNER PORTAL</h1>
          <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-rose-500"><LogOut className="w-5 h-5" /></button>
        </header>
        
        <div className="p-4 md:p-8 max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
