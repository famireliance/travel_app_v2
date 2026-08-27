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
  X,
  Menu,
  FileText,
  Trash2,
  Calendar,
  BookOpen,
  Ship,
  Store,
  Award,
  Clock,
  Save,
  Upload
} from 'lucide-react';

import AdminDashboard from '@/components/admin/AdminDashboard';
import AdminOrders from '@/components/admin/AdminOrders';
import IslandManagement from '@/components/admin/IslandManagement';
import FairyManagement from '@/components/admin/FairyManagement';
import AdminContacts from '@/components/admin/AdminContacts';
import AdminCoupons from '@/components/admin/AdminCoupons';
import AdminPromoCodes from '@/components/admin/AdminPromoCodes';
import AdminNewsletter from '@/components/admin/AdminNewsletter';
import AdminPartners from '@/components/admin/AdminPartners';
import AdminDistributors from '@/components/admin/AdminDistributors';

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

  // User Details Inspector State
  const [userDetails, setUserDetails] = useState<any>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // All Users State & Filters
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [userPlanFilter, setUserPlanFilter] = useState<'all' | 'free' | 'premium' | 'ultimate'>('all');
  const [userSortBy, setUserSortBy] = useState<'last_login' | 'created_at' | 'visits'>('last_login');
  const [userSearchTerm, setUserSearchTerm] = useState('');

  // Official Certificates Readiness State
  const [officialIslands, setOfficialIslands] = useState<any[]>([]);
  const [selectedOfficialIsland, setSelectedOfficialIsland] = useState<any>(null);
  const [officialForm, setOfficialForm] = useState<any>({
    islandId: '',
    official_cert_enabled: false,
    official_org_name: '一般社団法人 八重山ビジターズビューロー',
    official_seal_url: '',
    official_cert_price: 500,
    official_sales_start_at: new Date().toISOString().slice(0, 10),
    official_sales_end_at: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
    official_template_id: 'standard_seal'
  });
  const [customExtendDays, setCustomExtendDays] = useState<number>(30);

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

  // Premium Grant State
  const [premiumTier, setPremiumTier] = useState('premium');
  const [premiumMonths, setPremiumMonths] = useState(12);
  const [premiumMessage, setPremiumMessage] = useState('');

  // Moderation State
  const [diaries, setDiaries] = useState<any[]>([]);
  const [isLoadingDiaries, setIsLoadingDiaries] = useState(false);
  const [diariesMessage, setDiariesMessage] = useState('');

  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    const savedPassword = sessionStorage.getItem('admin_password');
    if (savedPassword) {
      fetch('/api/admin/verify-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: savedPassword })
      })
      .then(res => {
        if (res.ok) {
          setPassword(savedPassword);
          setIsAuthenticated(true);
        } else {
          sessionStorage.removeItem('admin_password');
        }
      })
      .catch(() => {
        sessionStorage.removeItem('admin_password');
      });
    }
    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
    const localISOTime = (new Date(Date.now() - tzoffset)).toISOString().slice(0, 16);
    setVisitedAt(localISOTime);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!loginInput) return;
    setIsLoggingIn(true);

    try {
      const res = await fetch('/api/admin/verify-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: loginInput })
      });
      const data = await res.json();

      if (!res.ok) {
        setLoginError(data.error || 'パスワードが正しくありません');
        toast.error('ログインに失敗しました');
        return;
      }

      sessionStorage.setItem('admin_password', loginInput);
      setPassword(loginInput);
      setIsAuthenticated(true);
      toast.success('管理者としてログインしました');
    } catch {
      setLoginError('通信エラーが発生しました');
      toast.error('ログイン処理中にエラーが発生しました');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_password');
    setPassword('');
    setIsAuthenticated(false);
    setUser(null);
    setUserDetails(null);
  };

  // Fetch Official Certificates Config Islands
  const fetchOfficialIslands = async () => {
    try {
      const res = await fetch('/api/admin/official-certificates', {
        headers: { 'x-admin-password': password }
      });
      const data = await res.json();
      if (res.ok) setOfficialIslands(data.islands || []);
    } catch (err) {
      toast.error('公的証明書データの取得に失敗しました');
    }
  };

  useEffect(() => {
    if (isAuthenticated && activeTab === 'official_certs') {
      fetchOfficialIslands();
    }
  }, [isAuthenticated, activeTab]);

  const handleSaveOfficialConfig = async (extendDays?: number) => {
    if (!selectedOfficialIsland && !officialForm.islandId) {
      toast.error('対象の島を選択してください');
      return;
    }
    try {
      const payload = {
        islandId: selectedOfficialIsland?.id || officialForm.islandId,
        ...officialForm,
        extendDays
      };
      const res = await fetch('/api/admin/official-certificates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(data.message || '公的証明書設定を更新しました');
      fetchOfficialIslands();
      if (data.island) setSelectedOfficialIsland(data.island);
    } catch (err: any) {
      toast.error(`更新エラー: ${err.message || '公的証明書設定の保存に失敗しました'}`);
    }
  };

  // Select User Inspector
  const handleSelectUser = async (u: any) => {
    setUser(u);
    setIsLoadingDetails(true);
    setUserDetails(null);
    try {
      const res = await fetch(`/api/admin/user-details?userId=${u.id}`, {
        headers: { 'x-admin-password': password }
      });
      const data = await res.json();
      if (res.status === 401) { handleLogout(); return; }
      if (!res.ok) { toast.error(data.error || 'ユーザー詳細の取得に失敗しました'); return; }
      setUserDetails(data);
    } catch (err: any) {
      console.error(err);
      toast.error(`ユーザー詳細取得エラー: ${err.message}`);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Search User by Email
  const handleSearchUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError('');
    setServiceRoleWarning('');
    setUser(null);
    setUserDetails(null);
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
      if (res.status === 401) { handleLogout(); return; }
      if (res.status === 503) { setServiceRoleWarning(data.error); return; }
      if (!res.ok) { setSearchError(data.error || 'エラーが発生しました'); return; }

      handleSelectUser(data);
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
        headers: { 'x-admin-password': password }
      });
      const data = await res.json();
      if (res.status === 401) { handleLogout(); return; }
      if (res.status === 503) { setServiceRoleWarning(data.error); return; }
      if (!res.ok) { setSearchError(data.error || 'エラーが発生しました'); return; }
      setAllUsers(data);
    } catch (err: any) {
      setSearchError(err.message);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Delete Visit Record
  const handleDeleteVisit = async (visitId: string) => {
    if (!window.confirm('この到達記録を削除しますか？')) return;
    try {
      const res = await fetch(`/api/admin/user-details?visitId=${visitId}`, {
        method: 'DELETE',
        headers: { 'x-admin-password': password }
      });
      if (res.ok) {
        toast.success('到達記録を削除しました');
        if (user) handleSelectUser(user);
      } else {
        toast.error('削除に失敗しました');
      }
    } catch (err: any) {
      toast.error(err.message);
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
        if (userDetails?.profile?.id === ticketModalUser.id) {
          setUserDetails((prev: any) => prev ? { ...prev, profile: { ...prev.profile, high_quality_tickets: data.tickets } } : prev);
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
          visitedAt: visitedAt ? new Date(visitedAt).toISOString() : new Date().toISOString(),
          note
        })
      });
      const data = await res.json();
      if (res.status === 401) { handleLogout(); return; }
      if (!res.ok) { setGrantMessage(`エラー: ${data.error}`); return; }

      setGrantMessage(data.message);
      toast.success('到達記録を付与しました');
      handleSelectUser(user);
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
    if (userPlanFilter !== 'all' && u.subscription_tier !== userPlanFilter) return false;
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
            {loginError && (
              <p className="text-xs text-rose-500 font-bold mt-2 bg-rose-950/50 border border-rose-800/50 p-2.5 rounded-lg text-center">
                ⚠️ {loginError}
              </p>
            )}
          </div>
          <button 
            type="submit" 
            disabled={isLoggingIn}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 rounded-xl transition shadow-lg active:scale-98 disabled:opacity-50"
          >
            {isLoggingIn ? '認証確認中...' : 'ログイン'}
          </button>
        </form>
      </div>
    );
  }

  const NAV_ITEMS = [
    { id: 'dashboard', label: 'ダッシュボード', icon: LayoutDashboard },
    { id: 'orders', label: '発送・注文管理', icon: Package },
    { id: 'user', label: 'ユーザー・権限管理', icon: Users },
    { id: 'official_certs', label: '公的証明書販売準備', icon: Award },
    { id: 'partners', label: '宿・交通パートナー', icon: Ship },
    { id: 'distributors', label: '売店・加盟店パートナー', icon: Store },
    { id: 'moderation', label: '投稿モデレーション', icon: ShieldAlert },
    { id: 'islands', label: '島マスター管理', icon: Palmtree },
    { id: 'fairies', label: 'ご当地妖精管理', icon: Sparkles },
    { id: 'contacts', label: 'お問い合わせ管理', icon: Mail },
    { id: 'newsletter', label: '一括メルマガ配信', icon: Mail },
    { id: 'coupons', label: 'プロモコード・クーポン', icon: Ticket },
    { id: 'password', label: 'パスワード変更', icon: KeyRound },
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
          <nav className="space-y-1">
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
                  className={`w-full text-left px-3 py-2 rounded-xl transition-all duration-200 flex items-center justify-between text-xs font-bold ${
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

                  <div className="flex flex-wrap items-center gap-3">
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
                              🎫 チケット
                            </button>
                            <button
                              onClick={() => handleSelectUser(u)}
                              className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-200 px-2.5 py-1 rounded-lg border border-gray-700 font-bold"
                            >
                              詳細インスペクター
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* User Details Inspector Section */}
            {isLoadingDetails && (
              <div className="bg-gray-900 border border-gray-800 p-8 rounded-2xl text-center">
                <Sparkles className="w-6 h-6 text-blue-400 animate-spin mx-auto mb-2" />
                <p className="text-xs text-gray-400">ユーザー詳細データを読み込み中...</p>
              </div>
            )}

            {user && !isLoadingDetails && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* User Profile Card */}
                <div className="bg-gray-900 border border-blue-500/30 rounded-2xl p-5 shadow-lg">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                        <h3 className="text-base font-bold text-white font-mono">{user.email}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          user.subscription_tier === 'ultimate' ? 'bg-amber-950 text-amber-300 border-amber-800' :
                          user.subscription_tier === 'premium' ? 'bg-purple-950 text-purple-300 border-purple-800' :
                          'bg-gray-800 text-gray-400 border-gray-700'
                        }`}>
                          {user.subscription_tier === 'ultimate' ? '👑 Ultimate' : user.subscription_tier === 'premium' ? '⭐ Premium' : 'Free'}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 font-mono mt-1">ID: {user.id}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="bg-blue-950 text-blue-300 border border-blue-800 px-3 py-1 rounded-xl text-xs font-bold">
                        🎫 高画質チケット: {user.high_quality_tickets || 0}枚
                      </span>
                      <button
                        onClick={() => { setTicketModalUser(user); setTicketInputCount(1); }}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition"
                      >
                        チケット付与
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Grant Premium Plan Form */}
                    <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 space-y-3">
                      <h4 className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
                        <Crown className="w-4 h-4" /> 会員プラン・VIP権限の設定
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] text-gray-400 block mb-1">プラン種別</label>
                          <select
                            value={premiumTier}
                            onChange={e => setPremiumTier(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-800 rounded-lg p-2 text-xs text-white"
                          >
                            <option value="free">Free (無料)</option>
                            <option value="premium">Premium (月額¥300相当)</option>
                            <option value="ultimate">Ultimate (月額¥980相当)</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-400 block mb-1">有効期間 (ヶ月)</label>
                          <input
                            type="number" min={1} max={36}
                            value={premiumMonths}
                            onChange={e => setPremiumMonths(Number(e.target.value))}
                            className="w-full bg-gray-900 border border-gray-800 rounded-lg p-2 text-xs text-white"
                          />
                        </div>
                      </div>
                      <button
                        onClick={handleGrantPremium}
                        className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded-lg text-xs transition"
                      >
                        プランを設定・更新する
                      </button>
                      {premiumMessage && <p className="text-[11px] text-emerald-400">{premiumMessage}</p>}
                    </div>

                    {/* Grant Island Visit Form */}
                    <form onSubmit={handleGrantVisit} className="bg-gray-950 p-4 rounded-xl border border-gray-800 space-y-3">
                      <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4" /> 島到達記録の代理付与
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-gray-400 block mb-1">島ID (例: ishigaki)</label>
                          <input type="text" value={islandId} onChange={e => setIslandId(e.target.value)} placeholder="ishigaki" required
                            className="w-full bg-gray-900 border border-gray-800 rounded-lg p-2 text-xs text-white" />
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-400 block mb-1">ステータス</label>
                          <select value={status} onChange={e => setStatus(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-800 rounded-lg p-2 text-xs text-white">
                            <option value="visited">visited (到達)</option>
                            <option value="verified_visited">verified_visited (GPS検証済)</option>
                            <option value="planning">planning (計画中)</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-400 block mb-1">到達日時</label>
                          <input type="datetime-local" value={visitedAt} onChange={e => setVisitedAt(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-800 rounded-lg p-2 text-xs text-white" />
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-400 block mb-1">備考 (任意)</label>
                          <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="現地イベント参加など"
                            className="w-full bg-gray-900 border border-gray-800 rounded-lg p-2 text-xs text-white" />
                        </div>
                      </div>
                      <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-lg text-xs transition">
                        到達記録を付与する
                      </button>
                      {grantMessage && <p className="text-[11px] text-emerald-400">{grantMessage}</p>}
                    </form>
                  </div>
                </div>

                {/* Full History Inspector */}
                {userDetails && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Island Visits */}
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow">
                      <h4 className="text-xs font-bold text-white mb-3 flex items-center justify-between">
                        <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-blue-400" /> 島到達記録</span>
                        <span className="text-xs text-gray-400 font-normal">{userDetails.visits?.length || 0} 件</span>
                      </h4>
                      <div className="max-h-52 overflow-y-auto divide-y divide-gray-800 text-xs">
                        {userDetails.visits?.length > 0 ? userDetails.visits.map((v: any) => (
                          <div key={v.id} className="py-2 flex items-center justify-between">
                            <div>
                              <span className="font-bold text-white">{v.island_id}</span>
                              <span className="ml-2 text-[10px] bg-gray-800 text-gray-300 px-1.5 py-0.5 rounded">{v.status}</span>
                              <p className="text-[10px] text-gray-500 font-mono mt-0.5">{v.visited_at ? new Date(v.visited_at).toLocaleString('ja-JP') : '-'}</p>
                            </div>
                            <button onClick={() => handleDeleteVisit(v.id)} className="text-red-400 hover:text-red-300 p-1.5 rounded hover:bg-red-950/40" title="到達記録を削除">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )) : <p className="text-xs text-gray-500 py-4 text-center">到達記録はありません</p>}
                      </div>
                    </div>

                    {/* Physical Orders */}
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow">
                      <h4 className="text-xs font-bold text-white mb-3 flex items-center justify-between">
                        <span className="flex items-center gap-2"><FileText className="w-4 h-4 text-amber-400" /> 物理証明書注文</span>
                        <span className="text-xs text-gray-400 font-normal">{userDetails.orders?.length || 0} 件</span>
                      </h4>
                      <div className="max-h-52 overflow-y-auto divide-y divide-gray-800 text-xs">
                        {userDetails.orders?.length > 0 ? userDetails.orders.map((o: any) => (
                          <div key={o.id} className="py-2">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-white">{o.type} ({o.island_id})</span>
                              <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-800 px-1.5 py-0.5 rounded">{o.status}</span>
                            </div>
                            <p className="text-[10px] text-gray-500 font-mono mt-0.5">{o.ordered_at ? new Date(o.ordered_at).toLocaleString('ja-JP') : '-'} | 宛名: {o.shipping_name}</p>
                          </div>
                        )) : <p className="text-xs text-gray-500 py-4 text-center">注文履歴はありません</p>}
                      </div>
                    </div>

                    {/* Digital Certificates */}
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow">
                      <h4 className="text-xs font-bold text-white mb-3 flex items-center justify-between">
                        <span className="flex items-center gap-2"><Award className="w-4 h-4 text-purple-400" /> 発行済デジタル証明書</span>
                        <span className="text-xs text-gray-400 font-normal">{userDetails.certificates?.length || 0} 件</span>
                      </h4>
                      <div className="max-h-52 overflow-y-auto divide-y divide-gray-800 text-xs">
                        {userDetails.certificates?.length > 0 ? userDetails.certificates.map((c: any) => (
                          <div key={c.id} className="py-2 flex items-center justify-between">
                            <div>
                              <span className="font-bold text-white">{c.island_id}</span>
                              <span className="ml-2 text-[10px] text-gray-400 font-mono">{c.type}</span>
                              <p className="text-[10px] text-gray-500 font-mono mt-0.5">{new Date(c.created_at).toLocaleString('ja-JP')}</p>
                            </div>
                          </div>
                        )) : <p className="text-xs text-gray-500 py-4 text-center">証明書履歴はありません</p>}
                      </div>
                    </div>

                    {/* Posted Diaries */}
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow">
                      <h4 className="text-xs font-bold text-white mb-3 flex items-center justify-between">
                        <span className="flex items-center gap-2"><BookOpen className="w-4 h-4 text-pink-400" /> 投稿島日記</span>
                        <span className="text-xs text-gray-400 font-normal">{userDetails.diaries?.length || 0} 件</span>
                      </h4>
                      <div className="max-h-52 overflow-y-auto divide-y divide-gray-800 text-xs">
                        {userDetails.diaries?.length > 0 ? userDetails.diaries.map((d: any) => (
                          <div key={d.id} className="py-2">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-amber-400">{d.island_id}</span>
                              <span className="text-[10px] text-gray-500 font-mono">{d.created_at ? new Date(d.created_at).toLocaleString('ja-JP') : '-'}</span>
                            </div>
                            <p className="text-gray-300 mt-1 line-clamp-2">{d.content}</p>
                          </div>
                        )) : <p className="text-xs text-gray-500 py-4 text-center">投稿日記はありません</p>}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 4. Official Certificates CMS Readiness Tab */}
        {activeTab === 'official_certs' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="border-b border-gray-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-white flex items-center gap-2">
                  <Award className="w-6 h-6 text-amber-400" />
                  公的証明書（観光協会・行政認定）事前準備＆販売期間設定
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  自治体・観光協会の提携合意後、即時に公式認定デジタル証明書の販売・ワンクリック期間延長が可能なシステム
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Island Selection */}
              <div className="lg:col-span-1 bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-col h-[70vh]">
                <h3 className="text-xs font-bold text-gray-400 uppercase mb-3">対象島を選択</h3>
                <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                  {officialIslands.map(is => (
                    <button
                      key={is.id}
                      onClick={() => {
                        setSelectedOfficialIsland(is);
                        setOfficialForm({
                          islandId: is.id,
                          official_cert_enabled: is.official_cert_enabled || false,
                          official_org_name: is.official_org_name || '一般社団法人 八重山ビジターズビューロー',
                          official_seal_url: is.official_seal_url || '',
                          official_cert_price: is.official_cert_price || 500,
                          official_sales_start_at: is.official_sales_start_at ? is.official_sales_start_at.substring(0, 10) : new Date().toISOString().slice(0, 10),
                          official_sales_end_at: is.official_sales_end_at ? is.official_sales_end_at.substring(0, 10) : new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
                          official_template_id: is.official_template_id || 'standard_seal'
                        });
                      }}
                      className={`w-full text-left p-3 rounded-xl transition border text-xs font-bold flex items-center justify-between ${
                        selectedOfficialIsland?.id === is.id
                          ? 'bg-amber-950/60 border-amber-500/60 text-white'
                          : 'bg-gray-950/60 border-gray-800/80 text-gray-300 hover:border-gray-700'
                      }`}
                    >
                      <div>
                        <p className="text-white">{is.name}</p>
                        <p className="text-[10px] text-gray-500 font-mono">ID: {is.id}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[9px] ${is.official_cert_enabled ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-gray-800 text-gray-400'}`}>
                        {is.official_cert_enabled ? '販売有効' : '無効'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Config Form */}
              <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-6 h-[70vh] overflow-y-auto space-y-5 text-xs">
                <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-400" />
                    {selectedOfficialIsland ? `「${selectedOfficialIsland.name}」の公的証明書設定` : '島を選択してください'}
                  </h3>
                </div>

                <div className="space-y-4">
                  {/* Enable Switch */}
                  <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white text-xs">公的認定証明書の即時販売を有効化</h4>
                      <p className="text-[10px] text-gray-400 mt-0.5">ONにするとユーザーが公印入り公式デジタル証明書を購入可能になります</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={officialForm.official_cert_enabled}
                        onChange={e => setOfficialForm({ ...officialForm, official_cert_enabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-gray-400 mb-1 font-bold">公認団体・自治体名 (例: 一般社団法人 八重山ビジターズビューロー)</label>
                    <input
                      type="text"
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl p-2.5 text-white"
                      value={officialForm.official_org_name}
                      onChange={e => setOfficialForm({ ...officialForm, official_org_name: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 mb-1 font-bold">公式角印・認定印画像URL (透明背景PNG推奨)</label>
                    <input
                      type="text"
                      placeholder="https://..."
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl p-2.5 text-white font-mono"
                      value={officialForm.official_seal_url}
                      onChange={e => setOfficialForm({ ...officialForm, official_seal_url: e.target.value })}
                    />
                  </div>

                  {/* Extension Buttons */}
                  <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 space-y-3">
                    <label className="block text-amber-400 font-bold flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" /> 販売期間 ＆ ワンクリック即時延長
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-gray-400 block mb-1">販売開始日</label>
                        <input
                          type="date"
                          className="w-full bg-gray-900 border border-gray-800 rounded-lg p-2 text-white font-mono"
                          value={officialForm.official_sales_start_at}
                          onChange={e => setOfficialForm({ ...officialForm, official_sales_start_at: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-400 block mb-1">販売終了日</label>
                        <input
                          type="date"
                          className="w-full bg-gray-900 border border-gray-800 rounded-lg p-2 text-white font-mono font-bold text-amber-400"
                          value={officialForm.official_sales_end_at}
                          onChange={e => setOfficialForm({ ...officialForm, official_sales_end_at: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-800 space-y-1.5">
                      <span className="text-[10px] text-gray-400 block font-bold">ワンクリック期間延長:</span>
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => handleSaveOfficialConfig(30)} className="bg-gray-800 hover:bg-gray-700 text-gray-200 px-3 py-1.5 rounded-lg border border-gray-700 font-bold transition">＋30日延長</button>
                        <button type="button" onClick={() => handleSaveOfficialConfig(90)} className="bg-gray-800 hover:bg-gray-700 text-gray-200 px-3 py-1.5 rounded-lg border border-gray-700 font-bold transition">＋90日延長</button>
                        <button type="button" onClick={() => handleSaveOfficialConfig(180)} className="bg-gray-800 hover:bg-gray-700 text-gray-200 px-3 py-1.5 rounded-lg border border-gray-700 font-bold transition">＋180日延長</button>
                        <button type="button" onClick={() => handleSaveOfficialConfig(365)} className="bg-gray-800 hover:bg-gray-700 text-gray-200 px-3 py-1.5 rounded-lg border border-gray-700 font-bold transition">＋1年延長</button>

                        <div className="flex items-center gap-1 ml-auto">
                          <input
                            type="number"
                            value={customExtendDays}
                            onChange={e => setCustomExtendDays(Number(e.target.value))}
                            className="w-16 bg-gray-900 border border-gray-800 rounded-lg p-1 text-center font-mono text-white"
                          />
                          <button type="button" onClick={() => handleSaveOfficialConfig(customExtendDays)} className="bg-amber-500 hover:bg-amber-400 text-black px-3 py-1.5 rounded-lg font-extrabold transition">指定日数追加</button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-800 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleSaveOfficialConfig()}
                      className="bg-amber-500 hover:bg-amber-400 text-black font-extrabold px-6 py-2.5 rounded-xl transition shadow active:scale-95 flex items-center gap-1.5"
                    >
                      <Save className="w-4 h-4" /> 公的証明書設定を保存する
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. Partners Tab */}
        {activeTab === 'partners' && (
          <AdminPartners password={password} />
        )}

        {/* 6. Distributors / Stores Tab */}
        {activeTab === 'distributors' && (
          <AdminDistributors password={password} />
        )}

        {/* 7. Moderation Tab */}
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

        {/* 8. Islands Tab */}
        {activeTab === 'islands' && (
          <IslandManagement password={password} />
        )}

        {/* 9. Fairies Tab */}
        {activeTab === 'fairies' && (
          <FairyManagement password={password} />
        )}

        {/* 10. Contacts Tab */}
        {activeTab === 'contacts' && (
          <AdminContacts password={password} />
        )}

        {/* 11. Newsletter Tab */}
        {activeTab === 'newsletter' && (
          <AdminNewsletter adminPassword={password} />
        )}

        {/* 12. Promo Codes / Coupons Tab */}
        {activeTab === 'coupons' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <AdminPromoCodes />
            <AdminCoupons password={password} />
          </div>
        )}

        {/* 13. Password Change Tab */}
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
