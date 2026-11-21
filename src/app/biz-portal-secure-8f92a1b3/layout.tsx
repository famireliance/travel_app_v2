'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  LayoutDashboard,
  Store,
  CalendarCheck,
  LogOut,
  Loader2,
  BookOpen,
  ShieldAlert,
  ArrowLeft,
  UserCheck,
} from 'lucide-react';
import Link from 'next/link';
import { getBizBasePath } from '@/lib/bizPortalPath';

export default function BizPortalLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [isOwnerAuthorized, setIsOwnerAuthorized] = useState(false);
  const [basePath, setBasePath] = useState('/biz-portal-secure-8f92a1b3');
  const router = useRouter();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    const bp = getBizBasePath();
    setBasePath(bp);
    let mounted = true;

    async function verifyRoleForSession(activeSession: any) {
      if (!activeSession) {
        if (!mounted) return;
        setSession(null);
        setIsOwnerAuthorized(false);
        setLoading(false);
        if (!pathnameRef.current.includes('/login')) {
          router.replace(`${bp}/login`);
        }
        return;
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', activeSession.user.id)
        .maybeSingle();

      if (!mounted) return;

      if (profile?.role === 'owner' || profile?.role === 'super_admin') {
        setSession(activeSession);
        setIsOwnerAuthorized(true);
      } else {
        // Do NOT call supabase.auth.signOut() automatically so B2C sessions are preserved
        setSession(activeSession);
        setIsOwnerAuthorized(false);
      }
      setLoading(false);
    }

    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      verifyRoleForSession(initialSession);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === 'INITIAL_SESSION') return;
      verifyRoleForSession(nextSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  useEffect(() => {
    if (!loading && !session && !pathname.includes('/login')) {
      router.replace(`${basePath}/login`);
    }
  }, [loading, session, pathname, basePath, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (pathname.includes('/login')) {
    return <div className="min-h-screen bg-slate-50">{children}</div>;
  }

  if (!session) return null;

  if (!isOwnerAuthorized) {
    const handleSwitchAccount = async () => {
      await supabase.auth.signOut();
      setSession(null);
      setIsOwnerAuthorized(false);
      router.replace(`${basePath}/login`);
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 border border-slate-200 text-center space-y-6">
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-200">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-slate-900 font-serif">
              オーナーアカウント専用画面です
            </h1>
            <p className="text-xs text-slate-600 leading-relaxed">
              現在ログイン中のアカウント
              {session.user?.email ? `（${session.user.email}）` : ''}
              には宿泊施設オーナー権限が付与されていません。一般の旅人マイページや離島マップは公開サイトより引き続きご利用いただけます。
            </p>
          </div>
          <div className="space-y-3 pt-2">
            <a
              href="https://island.kira-tabi.com"
              className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>KIRATABI 公開サイトへ戻る</span>
            </a>
            <button
              type="button"
              onClick={handleSwitchAccount}
              className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <UserCheck className="w-4 h-4" />
              <span>別アカウント（オーナー用）でログイン</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace(`${basePath}/login`);
  };

  const navItems = [
    { name: 'ダッシュボード', slug: '/dashboard', icon: LayoutDashboard },
    { name: '施設情報編集', slug: '/facility', icon: Store },
    { name: '予約管理', slug: '/reservations', icon: CalendarCheck },
    { name: 'オンライン宿泊台帳', slug: '/ledger', icon: BookOpen },
  ];

  // Treat '/' on partner.kira-tabi.com (or root stealth path) as '/dashboard'
  const normalizedPathname =
    pathname === '/' ||
    pathname === '/biz-portal-secure-8f92a1b3' ||
    pathname === '/biz-portal-secure-8f92a1b3/'
      ? `${basePath}/dashboard`
      : pathname;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar (Desktop) / Bottom Nav (Mobile) */}
      <nav className="fixed bottom-0 w-full md:relative md:w-64 bg-slate-900 text-slate-300 z-50 md:min-h-screen shadow-xl pb-safe md:pb-0">
        <div className="hidden md:block p-6">
          <h1 className="text-white font-bold text-lg tracking-widest uppercase">Owner Portal</h1>
          <p className="text-xs text-slate-500 mt-1">KIRATABI B2B System</p>
        </div>

        <ul className="flex md:flex-col justify-around md:justify-start gap-1 p-2 md:p-4">
          {navItems.map((item) => {
            const fullPath = `${basePath}${item.slug}`;
            const isActive =
              normalizedPathname.endsWith(item.slug) ||
              normalizedPathname.includes(`${item.slug}/`);
            const Icon = item.icon;
            return (
              <li key={item.name} className="flex-1 md:flex-none">
                <Link
                  href={fullPath}
                  className={`flex flex-col md:flex-row items-center gap-1 md:gap-3 p-3 md:px-4 md:py-3 rounded-xl transition-colors ${
                    isActive
                      ? 'bg-amber-500 text-slate-900 font-bold shadow-md'
                      : 'hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] md:text-sm">{item.name}</span>
                </Link>
              </li>
            );
          })}

          <li className="hidden md:block mt-auto pt-8">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-rose-950/50 hover:text-rose-400 transition-colors"
            >
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
          <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-rose-500">
            <LogOut className="w-5 h-5" />
          </button>
        </header>

        <div className="p-4 md:p-8 max-w-5xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
