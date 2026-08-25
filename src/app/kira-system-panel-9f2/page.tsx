'use client';

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  LayoutDashboard,
  Package,
  Users,
  ShieldAlert,
  Palmtree,
  Sparkles,
  Mail,
  Ticket,
  KeyRound,
  LogOut,
  Search,
  Filter,
  ArrowUpDown,
  TicketPlus,
  Crown,
  CheckCircle,
  XCircle,
  Menu,
  X,
  FileText
} from 'lucide-react';

import AdminDashboard from '@/components/admin/AdminDashboard';
import AdminOrders from '@/components/admin/AdminOrders';
import IslandManagement from '@/components/admin/IslandManagement';
import FairyManagement from '@/components/admin/FairyManagement';
import AdminContacts from '@/components/admin/AdminContacts';
import AdminCoupons from '@/components/admin/AdminCoupons';
import AdminPromoCodes from '@/components/admin/AdminPromoCodes';
import AdminNewsletter from '@/components/admin/AdminNewsletter';

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginInput, setLoginInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // User Management State
  const [searchEmail, setSearchEmail] = useState('');
  const [user, setUser] = useState<any>(null);
  const [searchError, setSearchError] = useState('');
  const [serviceRoleWarning, setServiceRoleWarning] = useState('');

  // All Users State & Filters
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [userPlanFilter, setUserPlanFilter] = useState<'all' | 'free' | 'premium' | 'ultimate'>('all');
  const [userSortBy, setUserSortBy] = useState<'last_login' | 'created_at' | 'visits'>('last_login');
  const [userSearchTerm, setUserSearchTerm] = useState('');

  // Grant Ticket State
  const [ticketModalUser, setTicketModalUser] = useState<any>(null);
  const [ticketInputCount, setTicketInputCount] = useState<number>(1);

  // Password Change State
  const [newPassword, setNewPassword] = useState('');
  const [changePasswordMessage, setChangePasswordMessage] = useState('');

  // Grant Visit State
  const [islandId, setIslandId] = useState('');
  const [status, setStatus] = useState('visited');
  const [visitedAt, setVisitedAt] = useState('');
  const [note, setNote] = useState('');
  const [grantMessage, setGrantMessage] = useState('');
  const [grantHistory, setGrantHistory] = useState<any[]>([]);

  // Premium Grant State
  const [premiumTier, setPremiumTier] = useState('premium');
  const [premiumMonths, setPremiumMonths] = useState(12);
  const [premiumMessage, setPremiumMessage] = useState('');

  // Moderation State
  const [diaries, setDiaries] = useState<any[]>([]);
  const [isLoadingDiaries, setIsLoadingDiaries] = useState(false);
  const [diariesMessage, setDiariesMessage] = useState('');

  // Certificates Requests State
  const [certRequests, setCertRequests] = useState<any[]>([]);
  const [isLoadingCerts, setIsLoadingCerts] = useState(false);
  const [certStatusFilter, setCertStatusFilter] = useState<'all' | 'pending' | 'processing' | 'shipped' | 'cancelled'>('all');
  const [certMemoEditing, setCertMemoEditing] = useState<string | null>(null);
  const [certMemoText, setCertMemoText] = useState('');

  useEffect(() => {
    const savedPassword = sessionStorage.getItem('admin_password');
    if (savedPassword) {
      setPassword(savedPassword);
      setIsAuthenticated(true);
    }
    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
    const localISOTime = (new Date(Date.now() - tzoffset)).toISOString().slice(0, 16);
    setVisitedAt(localISOTime);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginInput) {
      sessionStorage.setItem('admin_password', loginInput);
      setPassword(loginInput);
      setIsAuthenticated(true);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_password');
    setPassword('');
    setIsAuthenticated(false);
    setUser(null);
  };

  // Search User by Email
  const handleSearchUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError('');
    setServiceRoleWarning('');
    setUser(null);
    try {
      const res = await fetch('/api/admin/find-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password
        },
        body: JSON.stringify({ email: searchEmail })
      });
      const data = await res.json();
      if (res.status === 401) {
        handleLogout();
        return;
      }
      if (res.status === 503) {
        setServiceRoleWarning(data.error);
        return;
      }
      if (!res.ok) {
        setSearchError(data.error || 'エラーが発生しました');
        return;
      }
      setUser(data);
    } catch (err: any) {
      setSearchError(err.message);
    }
  };

  // Fetch All Users
  const handleFetchAllUsers = async () => {
    setIsLoadingUsers(true);
    setSearchError('');
    setServiceRoleWarning('');
    try {
      const res = await fetch('/api/admin/list-users', {
        method: 'GET',
        headers: {
          'x-admin-password': password
        }
      });
      const data = await res.json();
      if (res.status === 401) {
        handleLogout();
        return;
      }
      if (res.status === 503) {
        setServiceRoleWarning(data.error);
        return;
      }
      if (!res.ok) {
        setSearchError(data.error || 'エラーが発生しました');
        return;
      }
      setAllUsers(data);
    } catch (err: any) {
      setSearchError(err.message);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Grant Tickets to User
  const handleGrantTickets = async (action: 'add' | 'set') => {
    if (!ticketModalUser) return;
    try {
      const res = await fetch('/api/admin/grant-tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password
        },
        body: JSON.stringify({
          userId: ticketModalUser.id,
          ticketCount: ticketInputCount,
          action
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        setTicketModalUser(null);
        if (user && user.id === ticketModalUser.id) {
          setUser({ ...user, high_quality_tickets: data.tickets });
        }
        if (allUsers.length > 0) {
          setAllUsers(prev => prev.map(u => u.id === ticketModalUser.id ? { ...u, high_quality_tickets: data.tickets } : u));
        }
      } else {
        toast.error(data.error || 'チケット付与に失敗しました');
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Grant Visit
  const handleGrantVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGrantMessage('');
    if (!user) return;
    try {
      const res = await fetch('/api/admin/grant-visit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password
        },
        body: JSON.stringify({
          userId: user.id,
          islandId,
          status,
          visitedAt: new Date(visitedAt).toISOString(),
          note
        })
      });
      const data = await res.json();
      if (res.status === 401) { handleLogout(); return; }
      if (!res.ok) { setGrantMessage(`エラー: ${data.error}`); return; }

      setGrantMessage(data.message);
      toast.success('到達記録を付与しました');
      setGrantHistory(prev => [{
        id: Date.now(),
        email: user.email,
        islandId,
        status,
        visitedAt,
        note,
        grantedAt: new Date().toLocaleString()
      }, ...prev]);
      setIslandId('');
      setNote('');
    } catch (err: any) {
      setGrantMessage(`エラー: ${err.message}`);
    }
  };

  // Grant Premium Plan
  const handleGrantPremium = async () => {
    if (!user) return;
    setPremiumMessage('');
    if (!window.confirm(`「${user.email}」を「${premiumTier}」プランに設定しますか？（${premiumMonths}ヶ月間）`)) return;
    try {
      const res = await fetch('/api/admin/grant-premium', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password
        },
        body: JSON.stringify({ userId: user.id, tier: premiumTier, months: premiumMonths })
      });
      const data = await res.json();
      if (res.status === 401) { handleLogout(); return; }
      if (!res.ok) { setPremiumMessage(`エラー: ${data.error}`); return; }
      toast.success(data.message);
      setPremiumMessage(data.message);
      setUser({ ...user, subscription_tier: premiumTier });
    } catch (err: any) {
      setPremiumMessage(`エラー: ${err.message}`);
    }
  };

  // Change Admin Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePasswordMessage('');
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: password,
          newPassword
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setChangePasswordMessage(`エラー: ${data.error}`);
        return;
      }
      setChangePasswordMessage(`${data.message}\n新しいパスワード: ${data.newPassword}`);
      setNewPassword('');
    } catch (err: any) {
      setChangePasswordMessage(`エラー: ${err.message}`);
    }
  };

  // Fetch Diaries for Moderation
  const handleFetchDiaries = async () => {
    setIsLoadingDiaries(true);
    setDiariesMessage('');
    try {
      const res = await fetch('/api/admin/list-diaries', {
        method: 'GET',
        headers: { 'x-admin-password': password }
      });
      const data = await res.json();
      if (res.status === 401) { handleLogout(); return; }
      if (!res.ok) { setDiariesMessage(`エラー: ${data.error}`); return; }
      setDiaries(data);
    } catch (err: any) {
      setDiariesMessage(`エラー: ${err.message}`);
    } finally {
      setIsLoadingDiaries(false);
    }
  };

  // Moderate Diary
  const handleModerateDiary = async (diaryId: string, action: 'hide' | 'show' | 'delete') => {
    if (action === 'delete') {
      if (!window.confirm('本当にこの日記を削除しますか？この操作は取り消せません。')) return;
    }
    try {
      const res = await fetch('/api/admin/moderate-diary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password
        },
        body: JSON.stringify({ diaryId, action })
      });
      const data = await res.json();
      if (res.status === 401) { handleLogout(); return; }
      if (!res.ok) { toast.error(`エラー: ${data.error}`); return; }
      toast.success(data.message);
      if (action === 'delete') {
        setDiaries(prev => prev.filter(d => d.id !== diaryId));
      } else {
        setDiaries(prev => prev.map(d => d.id === diaryId ? { ...d, is_hidden: action === 'hide' } : d));
      }
    } catch (err: any) {
      toast.error(`エラー: ${err.message}`);
    }
  };

  // User List Filter & Sorting Logic
  const filteredUsers = allUsers.filter(u => {
    // Plan Filter
    if (userPlanFilter !== 'all' && u.subscription_tier !== userPlanFilter) return false;
    // Search Term Filter
    if (userSearchTerm.trim()) {
      const term = userSearchTerm.toLowerCase();
      const emailMatch = (u.email || '').toLowerCase().includes(term);
      const nickMatch = (u.nickname || '').toLowerCase().includes(term);
      const idMatch = (u.id || '').toLowerCase().includes(term);
      if (!emailMatch && !nickMatch && !idMatch) return false;
    }
    return true;
  }).sort((a, b) => {
    if (userSortBy === 'last_login') {
      const dateA = a.last_sign_in_at ? new Date(a.last_sign_in_at).getTime() : 0;
      const dateB = b.last_sign_in_at ? new Date(b.last_sign_in_at).getTime() : 0;
      return dateB - dateA;
    } else if (userSortBy === 'created_at') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    } else {
      return (b.visitCount || 0) - (a.visitCount || 0);
    }
  });

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-gray-900 p-8 rounded-2xl shadow-2xl max-w-md w-full border border-gray-800">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-blue-600/10 border border-blue-500/30 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-7 h-7 text-blue-400" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-wide">KIRATABI CMS ログイン</h1>
            <p className="text-xs text-gray-400 mt-1">管理者システム専用ログインパネル</p>
          </div>
          <div className="mb-5">
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">管理者パスワード</label>
            <input
              type="password"
              className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500 transition"
              value={loginInput}
              onChange={(e) => setLoginInput(e.target.value)}
              placeholder="パスワードを入力してください"
              required
            />
          </div>
          <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 rounded-xl transition shadow-lg active:scale-98">
            ログイン
          </button>
        </form>
      </div>
    );
  }

  const NAV_ITEMS = [
    { id: 'dashboard', label: 'ダッシュボード', icon: LayoutDashboard, badge: null },
    { id: 'orders', label: '発送・注文管理', icon: Package, badge: null },
    { id: 'user', label: 'ユーザー・権限管理', icon: Users, badge: null },
    { id: 'moderation', label: '投稿モデレーション', icon: ShieldAlert, badge: null },
    { id: 'islands', label: '島マスター管理', icon: Palmtree, badge: null },
    { id: 'fairies', label: 'ご当地妖精管理', icon: Sparkles, badge: null },
    { id: 'contacts', label: 'お問い合わせ管理', icon: Mail, badge: null },
    { id: 'newsletter', label: '一括メルマガ配信', icon: Mail, badge: null },
    { id: 'coupons', label: 'プロモコード・クーポン', icon: Ticket, badge: null },
    { id: 'certificates', label: '証明書申請管理', icon: FileText, badge: null },
    { id: 'password', label: 'パスワード変更', icon: KeyRound, badge: null },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col md:flex-row font-sans">
      {/* Mobile Top Navigation Header */}
      <div className="md:hidden bg-gray-900 border-b border-gray-800 p-4 flex items-center justify-between z-50">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <h1 className="font-extrabold text-white text-base">KIRATABI Admin</h1>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-gray-300 hover:text-white"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-gray-900/95 backdrop-blur-md border-r border-gray-800/80 p-4 flex flex-col justify-between transition-transform duration-300 md:static md:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div>
          {/* Logo Brand */}
          <div className="flex items-center gap-3 px-2 mb-6 pt-2">
            <div className="p-2 bg-gradient-to-tr from-amber-500 to-amber-300 text-black rounded-xl shadow font-black">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-white text-lg tracking-wider">KIRATABI</h2>
              <p className="text-[10px] font-mono text-amber-400">MANAGEMENT SYSTEM</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl transition-all duration-200 flex items-center justify-between text-xs font-bold ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-900/30'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                    <span>{item.label}</span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Logout */}
        <div className="pt-4 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-red-400 hover:bg-red-950/30 px-3.5 py-2.5 rounded-xl transition"
          >
            <LogOut className="w-4 h-4" />
            ログアウト
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {serviceRoleWarning && (
          <div className="mb-6 bg-amber-950/60 border border-amber-600/50 p-4 rounded-xl shadow flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
            <p className="text-amber-200 text-xs font-medium">{serviceRoleWarning}</p>
          </div>
        )}

        {/* 1. Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <AdminDashboard password={password} onNavigateTab={setActiveTab} />
        )}

        {/* 2. Orders Tab */}
        {activeTab === 'orders' && (
          <AdminOrders password={password} />
        )}

        {/* 3. User Management Tab */}
        {activeTab === 'user' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="border-b border-gray-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-white flex items-center gap-2">
                  <Users className="w-6 h-6 text-blue-400" />
                  ユーザー・権限・チケット管理
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  ユーザー検索、VIPプラン付与、到達付与、高画質証明書チケット管理
                </p>
              </div>
            </div>

            {/* User Search Bar Section */}
            <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-lg">
              <h3 className="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
                <Search className="w-4 h-4 text-blue-400" />
                メールアドレスで個別ユーザーを検索
              </h3>
              <form onSubmit={handleSearchUser} className="flex gap-3">
                <input
                  type="email"
                  placeholder="user@example.com"
                  className="flex-1 bg-gray-950 border border-gray-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-blue-500"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  required
                />
                <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold text-xs transition shadow active:scale-95">
                  検索
                </button>
              </form>
              {searchError && <p className="text-red-400 text-xs mt-3 font-medium">{searchError}</p>}

              <div className="mt-5 pt-5 border-t border-gray-800 flex items-center justify-between">
                <button
                  onClick={handleFetchAllUsers}
                  disabled={isLoadingUsers}
                  className="bg-gray-800 hover:bg-gray-700 text-gray-200 px-5 py-2.5 rounded-xl text-xs font-bold transition border border-gray-700 flex items-center gap-2"
                >
                  <Users className="w-4 h-4 text-blue-400" />
                  {isLoadingUsers ? '取得中...' : '全登録ユーザーを一覧表示・フィルタ'}
                </button>
              </div>
            </div>

            {/* Filtered All Users List */}
            {allUsers.length > 0 && (
              <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-lg space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-4">
                  <h3 className="text-sm font-bold text-gray-200">
                    登録ユーザー一覧 (該当: <span className="text-blue-400 font-extrabold">{filteredUsers.length}</span> / 全 {allUsers.length}名)
                  </h3>

                  {/* Filter & Sort Controls */}
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Plan Filter */}
                    <div className="flex items-center gap-1 bg-gray-950 p-1 rounded-xl border border-gray-800">
                      <Filter className="w-3.5 h-3.5 text-gray-400 ml-2" />
                      <button
                        onClick={() => setUserPlanFilter('all')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${userPlanFilter === 'all' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}
                      >
                        すべて
                      </button>
                      <button
                        onClick={() => setUserPlanFilter('free')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${userPlanFilter === 'free' ? 'bg-gray-700 text-white' : 'text-gray-400'}`}
                      >
                        Free
                      </button>
                      <button
                        onClick={() => setUserPlanFilter('premium')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${userPlanFilter === 'premium' ? 'bg-purple-600 text-white' : 'text-gray-400'}`}
                      >
                        Premium
                      </button>
                      <button
                        onClick={() => setUserPlanFilter('ultimate')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${userPlanFilter === 'ultimate' ? 'bg-amber-500 text-black' : 'text-gray-400'}`}
                      >
                        Ultimate
                      </button>
                    </div>

                    {/* Sorting */}
                    <div className="flex items-center gap-1 bg-gray-950 px-2 py-1.5 rounded-xl border border-gray-800 text-xs">
                      <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
                      <select
                        value={userSortBy}
                        onChange={e => setUserSortBy(e.target.value as any)}
                        className="bg-transparent text-gray-300 focus:outline-none"
                      >
                        <option value="last_login">最終ログイン順</option>
                        <option value="created_at">登録日順</option>
                        <option value="visits">到達数順</option>
                      </select>
                    </div>

                    {/* Quick Filter Search */}
                    <input
                      type="text"
                      placeholder="メール/ニックネーム検索..."
                      value={userSearchTerm}
                      onChange={e => setUserSearchTerm(e.target.value)}
                      className="bg-gray-950 border border-gray-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-gray-300">
                    <thead className="border-b border-gray-800 text-gray-400 uppercase font-semibold">
                      <tr>
                        <th className="py-2.5 pr-4">ユーザー</th>
                        <th className="py-2.5 pr-4">プラン</th>
                        <th className="py-2.5 pr-4">所有チケット</th>
                        <th className="py-2.5 pr-4">到達数</th>
                        <th className="py-2.5 pr-4">登録日</th>
                        <th className="py-2.5 pr-4">最終ログイン</th>
                        <th className="py-2.5 text-right">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/60">
                      {filteredUsers.map((u: any) => (
                        <tr key={u.id} className="hover:bg-gray-800/40 transition">
                          <td className="py-3 pr-4">
                            <p className="font-bold text-white font-mono">{u.email}</p>
                            <p className="text-[10px] text-gray-500">ID: {u.id.substring(0, 8)}...</p>
                          </td>
                          <td className="py-3 pr-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              u.subscription_tier === 'ultimate' ? 'bg-amber-950 text-amber-300 border-amber-800' :
                              u.subscription_tier === 'premium' ? 'bg-purple-950 text-purple-300 border-purple-800' :
                              'bg-gray-800 text-gray-400 border-gray-700'
                            }`}>
                              {u.subscription_tier === 'ultimate' ? '👑 Ultimate' : u.subscription_tier === 'premium' ? '⭐ Premium' : 'Free'}
                            </span>
                          </td>
                          <td className="py-3 pr-4">
                            <span className="bg-blue-950 text-blue-300 px-2 py-0.5 rounded border border-blue-800 font-bold font-mono">
                              🎫 {u.high_quality_tickets || 0}枚
                            </span>
                          </td>
                          <td className="py-3 pr-4">
                            <span className="font-bold text-white bg-gray-800 px-2 py-0.5 rounded">
                              {u.visitCount || 0}
                            </span>
                          </td>
                          <td className="py-3 pr-4 text-gray-400 font-mono">
                            {new Date(u.created_at).toLocaleDateString('ja-JP')}
                          </td>
                          <td className="py-3 pr-4 text-gray-400 font-mono">
                            {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString('ja-JP') : '-'}
                          </td>
                          <td className="py-3 text-right space-x-2">
                            <button
                              onClick={() => {
                                setTicketModalUser(u);
                                setTicketInputCount(1);
                              }}
                              className="text-xs bg-blue-900/60 hover:bg-blue-800 text-blue-200 px-2.5 py-1 rounded-lg border border-blue-700/50"
                            >
                              🎫 チケット付与
                            </button>
                            <button
                              onClick={() => {
                                setUser(u);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-200 px-2.5 py-1 rounded-lg border border-gray-700"
                            >
                              選択
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Selected User Details & Grant Form */}
            {user && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Profile Card & VIP Grant */}
                <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-lg space-y-5">
                  <h3 className="text-base font-bold text-green-400 flex items-center gap-2 border-b border-gray-800 pb-3">
                    <CheckCircle className="w-5 h-5" />
                    選択中のユーザー情報
                  </h3>
                  <div className="space-y-2 text-xs">
                    <p><span className="text-gray-400">ID:</span> <span className="font-mono text-white">{user.id}</span></p>
                    <p><span className="text-gray-400">Email:</span> <span className="font-mono text-white font-bold">{user.email}</span></p>
                    <p><span className="text-gray-400">現在のプラン:</span> <span className="font-bold text-amber-400 uppercase">{user.subscription_tier || 'free'}</span></p>
                    <p><span className="text-gray-400">所有証明書チケット:</span> <span className="font-bold text-blue-400">{user.high_quality_tickets || 0} 枚</span></p>
                    <p><span className="text-gray-400">島訪問数:</span> <span className="text-base font-black text-white">{user.visitCount} 島</span></p>
                  </div>

                  {/* VIP Plan Assignment */}
                  <div className="pt-4 border-t border-gray-800 space-y-3">
                    <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      <Crown className="w-4 h-4" /> VIP プレミアム・Ultimateプラン変更
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-1">対象プラン</label>
                        <select
                          className="w-full bg-gray-950 border border-gray-800 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-amber-500"
                          value={premiumTier}
                          onChange={(e) => setPremiumTier(e.target.value)}
                        >
                          <option value="premium">Premium (¥480/月)</option>
                          <option value="ultimate">Ultimate (¥980/月)</option>
                          <option value="free">Free (一般ユーザーに戻す)</option>
                        </select>
                      </div>
                      {premiumTier !== 'free' && (
                        <div>
                          <label className="block text-[10px] text-gray-400 mb-1">有効期間（ヶ月）</label>
                          <input
                            type="number"
                            min={1}
                            max={120}
                            className="w-full bg-gray-950 border border-gray-800 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-amber-500"
                            value={premiumMonths}
                            onChange={(e) => setPremiumMonths(Number(e.target.value))}
                          />
                        </div>
                      )}
                    </div>
                    <button
                      onClick={handleGrantPremium}
                      className="w-full bg-amber-600 hover:bg-amber-500 text-black font-extrabold py-2.5 rounded-xl text-xs transition shadow active:scale-95"
                    >
                      {premiumTier === 'free' ? '無料プランに変更' : `${premiumTier.toUpperCase()} を付与する`}
                    </button>
                    {premiumMessage && (
                      <p className={`text-xs ${premiumMessage.includes('エラー') ? 'text-red-400' : 'text-green-400'}`}>
                        {premiumMessage}
                      </p>
                    )}
                  </div>
                </div>

                {/* Visit Grant Form */}
                <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-lg space-y-4">
                  <h3 className="text-base font-bold text-purple-400 flex items-center gap-2 border-b border-gray-800 pb-3">
                    <Palmtree className="w-5 h-5" />
                    到達記録の代理付与
                  </h3>
                  <form onSubmit={handleGrantVisit} className="space-y-3 text-xs">
                    <div>
                      <label className="block text-gray-400 mb-1 font-medium">島ID (例: ishigaki, yakushima)</label>
                      <input
                        type="text"
                        className="w-full bg-gray-950 border border-gray-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-purple-500"
                        value={islandId}
                        onChange={(e) => setIslandId(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-1 font-medium">ステータス</label>
                      <select
                        className="w-full bg-gray-950 border border-gray-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-purple-500"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                      >
                        <option value="visited">訪問済み (visited)</option>
                        <option value="verified_visited">公式認定訪問 (verified_visited)</option>
                        <option value="planning">行きたい (planning)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-1 font-medium">到達日時</label>
                      <input
                        type="datetime-local"
                        className="w-full bg-gray-950 border border-gray-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-purple-500"
                        value={visitedAt}
                        onChange={(e) => setVisitedAt(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-1 font-medium">メモ (任意)</label>
                      <textarea
                        className="w-full bg-gray-950 border border-gray-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-purple-500"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={2}
                      />
                    </div>
                    <button type="submit" className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 rounded-xl transition shadow active:scale-95">
                      到達記録を付与
                    </button>
                    {grantMessage && (
                      <p className={`text-xs ${grantMessage.includes('エラー') ? 'text-red-400' : 'text-green-400'}`}>
                        {grantMessage}
                      </p>
                    )}
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. Moderation Tab */}
        {activeTab === 'moderation' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="border-b border-gray-800 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-white flex items-center gap-2">
                  <ShieldAlert className="w-6 h-6 text-red-400" />
                  投稿モデレーション・通報対応
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  不適切な島日記投稿の確認、非表示（公開停止）、および削除処理
                </p>
              </div>
              <button
                onClick={handleFetchDiaries}
                disabled={isLoadingDiaries}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition disabled:opacity-50"
              >
                {isLoadingDiaries ? '取得中...' : '最新の日記を取得'}
              </button>
            </div>

            {diariesMessage && <p className="text-red-400 text-xs">{diariesMessage}</p>}

            {diaries.length > 0 ? (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-lg">
                <table className="w-full text-left text-xs text-gray-300">
                  <thead className="bg-gray-950 text-gray-400 uppercase font-semibold border-b border-gray-800">
                    <tr>
                      <th className="p-3">投稿者ID</th>
                      <th className="p-3">対象島ID</th>
                      <th className="p-3">投稿日時</th>
                      <th className="p-3 w-1/3">内容プレビュー</th>
                      <th className="p-3">状態</th>
                      <th className="p-3 text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {diaries.map(d => (
                      <tr key={d.id} className="hover:bg-gray-850">
                        <td className="p-3 font-mono text-[11px]">{d.user_id?.substring(0, 8)}...</td>
                        <td className="p-3 font-bold text-amber-400">{d.island_id}</td>
                        <td className="p-3 font-mono text-gray-400">{new Date(d.created_at).toLocaleString('ja-JP')}</td>
                        <td className="p-3">
                          <p className="line-clamp-2 text-gray-200">{d.content}</p>
                          {d.photo_url && (
                            <a href={d.photo_url} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline text-[10px] mt-1 inline-block">
                              📷 写真を確認
                            </a>
                          )}
                        </td>
                        <td className="p-3">
                          {d.is_hidden ? (
                            <span className="bg-red-950 text-red-300 px-2 py-0.5 rounded-full text-[10px] font-bold border border-red-800">非表示</span>
                          ) : (
                            <span className="bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded-full text-[10px] font-bold border border-emerald-800">公開中</span>
                          )}
                        </td>
                        <td className="p-3 text-right space-x-2">
                          {d.is_hidden ? (
                            <button
                              onClick={() => handleModerateDiary(d.id, 'show')}
                              className="text-emerald-400 hover:underline font-bold"
                            >
                              再公開
                            </button>
                          ) : (
                            <button
                              onClick={() => handleModerateDiary(d.id, 'hide')}
                              className="text-amber-400 hover:underline font-bold"
                            >
                              非表示にする
                            </button>
                          )}
                          <button
                            onClick={() => handleModerateDiary(d.id, 'delete')}
                            className="text-red-400 hover:underline font-bold ml-2"
                          >
                            削除
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-gray-500 py-8 text-center bg-gray-900 border border-gray-800 rounded-2xl">
                モデレーション対象の日記はありません。「最新の日記を取得」ボタンを押してください。
              </p>
            )}
          </div>
        )}

        {/* 5. Islands Tab */}
        {activeTab === 'islands' && (
          <IslandManagement password={password} />
        )}

        {/* 6. Fairies Tab */}
        {activeTab === 'fairies' && (
          <FairyManagement password={password} />
        )}

        {/* 7. Contacts Tab */}
        {activeTab === 'contacts' && (
          <AdminContacts password={password} />
        )}

        {/* 8. Newsletter Tab */}
        {activeTab === 'newsletter' && (
          <AdminNewsletter adminPassword={password} />
        )}

        {/* 9. Promo Codes / Coupons Tab */}
        {activeTab === 'coupons' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <AdminPromoCodes />
            <AdminCoupons password={password} />
          </div>
        )}

        {/* 10. Password Change Tab */}
        {activeTab === 'password' && (
          <div className="max-w-xl mx-auto space-y-6 animate-in fade-in duration-300">
            <h2 className="text-2xl font-black text-white flex items-center gap-2 border-b border-gray-800 pb-4">
              <KeyRound className="w-6 h-6 text-amber-400" />
              管理者パスワード変更
            </h2>
            <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-lg">
              <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
                <div>
                  <label className="block text-gray-400 mb-1 font-bold">新しいパスワード (8文字以上)</label>
                  <input
                    type="password"
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                </div>
                <button type="submit" className="w-full bg-amber-500 hover:bg-amber-400 text-black font-extrabold py-3 rounded-xl transition shadow active:scale-95">
                  新しいパスワードのハッシュを生成
                </button>
              </form>
              {changePasswordMessage && (
                <div className="mt-5 p-4 bg-gray-950 border border-gray-800 rounded-xl">
                  <pre className="whitespace-pre-wrap text-xs text-emerald-400 font-mono">
                    {changePasswordMessage}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Ticket Grant Modal */}
      {ticketModalUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-sm w-full p-6 text-white space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-sm font-bold flex items-center gap-2 text-blue-400">
                <TicketPlus className="w-5 h-5" />
                高画質証明書チケットの付与
              </h3>
              <button onClick={() => setTicketModalUser(null)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-xs space-y-1 text-gray-300">
              <p><span className="text-gray-400">対象:</span> <span className="font-bold text-white font-mono">{ticketModalUser.email}</span></p>
              <p><span className="text-gray-400">現在所有数:</span> <span className="font-bold text-blue-400">{ticketModalUser.high_quality_tickets || 0} 枚</span></p>
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-400">付与・設定枚数</label>
              <input
                type="number"
                min={1}
                max={100}
                value={ticketInputCount}
                onChange={e => setTicketInputCount(Number(e.target.value))}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500 font-bold"
              />
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => handleGrantTickets('add')}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl text-xs transition shadow"
              >
                ＋ 枚数を追加
              </button>
              <button
                onClick={() => handleGrantTickets('set')}
                className="bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold py-2.5 rounded-xl text-xs transition border border-gray-700"
              >
                指定数で上書き
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
