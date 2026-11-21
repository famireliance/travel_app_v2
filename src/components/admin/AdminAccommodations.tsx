'use client';

import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  BedDouble,
  Plus,
  Search,
  CheckCircle2,
  EyeOff,
  ExternalLink,
  Copy,
  Trash2,
  Edit3,
  UserPlus,
  RefreshCw,
  ShieldAlert,
  KeyRound,
  Save,
  X,
  Sparkles,
} from 'lucide-react';
import { ALL_ISLANDS_MASTER_DICTIONARY } from '@/data/allIslandsMaster';

const B2B_PORTAL_INVITE_URL =
  'https://island.kira-tabi.com/biz-portal-secure-8f92a1b3/login?partner_key=kirab2b8f';

interface AccommodationRow {
  id: string;
  island_id: string;
  island_name?: string;
  island_prefecture?: string;
  owner_id?: string | null;
  owner_email?: string | null;
  owner_nickname?: string | null;
  owner_role?: string | null;
  name: string;
  phone_number?: string;
  plan_tier: 'free' | 'paid_standard' | 'paid_premium' | string;
  is_verified: boolean;
  address?: string;
  website_url?: string;
  description?: string;
  price_range?: string;
  has_pickup?: boolean;
  booking_mode: 'request_based' | 'instant_booking' | string;
  deposit_policy?: string;
  is_test_inn?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface FormState {
  id?: string;
  island_id: string;
  name: string;
  phone_number: string;
  address: string;
  website_url: string;
  description: string;
  price_range: string;
  plan_tier: 'free' | 'paid_standard' | 'paid_premium';
  booking_mode: 'request_based' | 'instant_booking';
  has_pickup: boolean;
  is_verified: boolean;
  owner_email: string;
  owner_password: string;
}

const INITIAL_FORM: FormState = {
  island_id: '392',
  name: '',
  phone_number: '',
  address: '',
  website_url: '',
  description: '',
  price_range: '¥10,000〜 / 1泊2食',
  plan_tier: 'paid_standard',
  booking_mode: 'request_based',
  has_pickup: false,
  is_verified: true,
  owner_email: '',
  owner_password: '',
};

function generateInitialPassword(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let result = 'Kira';
  for (let i = 0; i < 8; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export default function AdminAccommodations({ password }: { password: string }) {
  const [accommodations, setAccommodations] = useState<AccommodationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form & Edit State
  const [showForm, setShowForm] = useState(false);
  const [islandSearch, setIslandSearch] = useState('');
  const [formData, setFormData] = useState<FormState>({ ...INITIAL_FORM });

  // Table Filter State
  const [tableSearch, setTableSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'hidden' | 'test'>('all');

  // Owner Quick Assignment Modal State
  const [ownerModalTarget, setOwnerModalTarget] = useState<AccommodationRow | null>(null);
  const [ownerModalEmail, setOwnerModalEmail] = useState('');
  const [ownerModalPassword, setOwnerModalPassword] = useState('');
  const [assigningOwner, setAssigningOwner] = useState(false);

  const allMasterIslands = useMemo(() => {
    return Object.values(ALL_ISLANDS_MASTER_DICTIONARY)
      .map((isl: any) => ({
        id: String(isl.id),
        name: String(isl.name || ''),
        prefecture: String(isl.prefecture || ''),
      }))
      .sort((a, b) => Number(a.id) - Number(b.id));
  }, []);

  const filteredMasterIslands = useMemo(() => {
    const q = islandSearch.trim().toLowerCase();
    if (!q) return allMasterIslands;
    return allMasterIslands.filter(
      (isl) =>
        isl.name.toLowerCase().includes(q) ||
        isl.prefecture.toLowerCase().includes(q) ||
        isl.id.toLowerCase() === q
    );
  }, [allMasterIslands, islandSearch]);

  const fetchAccommodations = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/accommodations', {
        headers: { 'x-admin-password': password },
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || '宿泊施設データの取得に失敗しました');
        return;
      }
      setAccommodations(data.accommodations || []);
    } catch {
      toast.error('通信エラーにより宿泊施設一覧を取得できませんでした');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccommodations();
  }, []);

  const stats = useMemo(() => {
    const total = accommodations.length;
    const testOrUnverified = accommodations.filter(
      (a) => !a.is_verified || a.is_test_inn || a.name.includes('架空') || a.name.includes('テスト用')
    );
    const publishedReal = accommodations.filter(
      (a) =>
        a.is_verified &&
        !a.is_test_inn &&
        !a.name.includes('架空') &&
        !a.name.includes('テスト用')
    );
    const exposedTestInns = accommodations.filter(
      (a) => a.is_verified && (a.is_test_inn || a.name.includes('架空') || a.name.includes('テスト用'))
    );
    return {
      total,
      publishedRealCount: publishedReal.length,
      testOrUnverifiedCount: testOrUnverified.length,
      exposedTestCount: exposedTestInns.length,
    };
  }, [accommodations]);

  const filteredRows = useMemo(() => {
    return accommodations.filter((acc) => {
      const isTest =
        Boolean(acc.is_test_inn) || acc.name.includes('架空') || acc.name.includes('テスト用');
      if (statusFilter === 'published' && (!acc.is_verified || isTest)) return false;
      if (statusFilter === 'hidden' && acc.is_verified) return false;
      if (statusFilter === 'test' && !isTest) return false;

      if (tableSearch.trim()) {
        const q = tableSearch.trim().toLowerCase();
        const matchName = (acc.name || '').toLowerCase().includes(q);
        const matchIsland = (acc.island_name || '').toLowerCase().includes(q);
        const matchOwner = (acc.owner_email || '').toLowerCase().includes(q);
        const matchPhone = (acc.phone_number || '').toLowerCase().includes(q);
        if (!matchName && !matchIsland && !matchOwner && !matchPhone) return false;
      }
      return true;
    });
  }, [accommodations, statusFilter, tableSearch]);

  const handleCopyInviteLink = (customEmail?: string | null, innName?: string) => {
    if (customEmail && innName) {
      const inviteText = [
        `【KIRATABI B2B宿泊施設ポータル ご案内】`,
        `対象施設: ${innName}`,
        `ログインURL: ${B2B_PORTAL_INVITE_URL}`,
        `ログインID: ${customEmail}`,
      ].join('\n');
      navigator.clipboard.writeText(inviteText);
      toast.success('オーナー向け招待案内文（専用キー付きURL＋ID）をコピーしました');
      return;
    }
    navigator.clipboard.writeText(B2B_PORTAL_INVITE_URL);
    toast.success('B2Bポータル招待URL（?partner_key=kirab2b8f）をコピーしました');
  };

  const handleBulkHideTestInns = async () => {
    if (!window.confirm('名前に「架空」または「テスト用」を含む全ての宿泊施設を一括で非公開（is_verified = false）にしますか？')) {
      return;
    }
    try {
      const res = await fetch('/api/admin/accommodations', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
        body: JSON.stringify({ action: 'hide_test_inns' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(data.message || '一括非公開が完了しました');
      fetchAccommodations();
    } catch (err: any) {
      toast.error(err.message || '一括非公開処理に失敗しました');
    }
  };

  const handleBulkDeleteTestInns = async () => {
    if (!window.confirm('【注意】名前に「架空」または「テスト用」を含む宿泊施設をDBから完全に削除します。よろしいですか？')) {
      return;
    }
    try {
      const res = await fetch('/api/admin/accommodations', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
        body: JSON.stringify({ action: 'delete_test_inns' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(data.message || 'テスト宿の一括削除が完了しました');
      fetchAccommodations();
    } catch (err: any) {
      toast.error(err.message || '一括削除に失敗しました');
    }
  };

  const handleToggleVerified = async (acc: AccommodationRow) => {
    const nextVal = !acc.is_verified;
    try {
      const res = await fetch('/api/admin/accommodations', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
        body: JSON.stringify({ id: acc.id, is_verified: nextVal }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`「${acc.name}」を${nextVal ? '公開' : '非公開'}に変更しました`);
      setAccommodations((prev) =>
        prev.map((row) => (row.id === acc.id ? { ...row, is_verified: nextVal } : row))
      );
    } catch (err: any) {
      toast.error(err.message || '公開状態の更新に失敗しました');
    }
  };

  const handleOpenCreateForm = () => {
    setFormData({ ...INITIAL_FORM });
    setIslandSearch('');
    setShowForm(true);
  };

  const handleOpenEditForm = (acc: AccommodationRow) => {
    setFormData({
      id: acc.id,
      island_id: String(acc.island_id || '392'),
      name: acc.name || '',
      phone_number: acc.phone_number || '',
      address: acc.address || '',
      website_url: acc.website_url || '',
      description: acc.description || '',
      price_range: acc.price_range || '',
      plan_tier:
        acc.plan_tier === 'free' || acc.plan_tier === 'paid_premium'
          ? acc.plan_tier
          : 'paid_standard',
      booking_mode:
        acc.booking_mode === 'instant_booking' ? 'instant_booking' : 'request_based',
      has_pickup: Boolean(acc.has_pickup),
      is_verified: Boolean(acc.is_verified),
      owner_email: acc.owner_email || '',
      owner_password: '',
    });
    setIslandSearch('');
    setShowForm(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const isEdit = Boolean(formData.id);
    try {
      const payload: Record<string, any> = {
        island_id: formData.island_id,
        name: formData.name,
        phone_number: formData.phone_number,
        address: formData.address,
        website_url: formData.website_url,
        description: formData.description,
        price_range: formData.price_range,
        plan_tier: formData.plan_tier,
        booking_mode: formData.booking_mode,
        has_pickup: formData.has_pickup,
        is_verified: formData.is_verified,
      };
      if (isEdit) {
        payload.id = formData.id;
        payload.owner_email = formData.owner_email.trim();
        if (formData.owner_password.trim()) {
          payload.owner_password = formData.owner_password.trim();
        }
      } else if (formData.owner_email.trim()) {
        payload.owner_email = formData.owner_email.trim();
        if (formData.owner_password.trim()) {
          payload.owner_password = formData.owner_password.trim();
        }
      }

      const res = await fetch('/api/admin/accommodations', {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(data.message || (isEdit ? '更新しました' : '新規登録しました'));
      setShowForm(false);
      setFormData({ ...INITIAL_FORM });
      fetchAccommodations();
    } catch (err: any) {
      toast.error(err.message || '保存に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignOwnerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerModalTarget) return;
    setAssigningOwner(true);
    try {
      const res = await fetch('/api/admin/accommodations', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
        body: JSON.stringify({
          id: ownerModalTarget.id,
          owner_email: ownerModalEmail.trim(),
          owner_password: ownerModalPassword.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(data.message || 'オーナー割当を更新しました');
      setOwnerModalTarget(null);
      setOwnerModalEmail('');
      setOwnerModalPassword('');
      fetchAccommodations();
    } catch (err: any) {
      toast.error(err.message || 'オーナー割当に失敗しました');
    } finally {
      setAssigningOwner(false);
    }
  };

  const handleDelete = async (acc: AccommodationRow) => {
    if (!window.confirm(`「${acc.name}」を削除しますか？この操作は取り消せません。`)) return;
    try {
      const res = await fetch(`/api/admin/accommodations?id=${encodeURIComponent(acc.id)}`, {
        method: 'DELETE',
        headers: { 'x-admin-password': password },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(data.message || '削除しました');
      setAccommodations((prev) => prev.filter((r) => r.id !== acc.id));
    } catch (err: any) {
      toast.error(err.message || '削除に失敗しました');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="border-b border-gray-800 pb-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
            <BedDouble className="w-6 h-6 text-amber-400" />
            宿泊施設・B2Bオーナー管理
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            提携宿の登録・公開制御（is_verified）、テスト/架空宿の遮断、B2Bオーナーアカウントの発行・紐付けを一元管理します
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => handleCopyInviteLink()}
            className="bg-gray-900 hover:bg-gray-800 text-emerald-300 border border-emerald-800/70 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
          >
            <Copy className="w-3.5 h-3.5" />
            B2B招待URLをコピー
          </button>
          <button
            type="button"
            onClick={fetchAccommodations}
            className="bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            再読込
          </button>
          <button
            type="button"
            onClick={handleOpenCreateForm}
            className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-gray-950 font-extrabold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-lg transition"
          >
            <Plus className="w-4 h-4" />
            新規提携宿・オーナー登録
          </button>
        </div>
      </div>

      {/* Summary Banner & One-Click Test Inn Shield */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <span className="text-[11px] font-bold text-gray-400 uppercase">全登録施設数</span>
          <p className="text-3xl font-black text-white font-mono mt-1">{stats.total}</p>
          <p className="text-[11px] text-gray-500 mt-1">public.accommodations 全レコード</p>
        </div>

        <div className="bg-emerald-950/30 border border-emerald-800/50 rounded-2xl p-5">
          <span className="text-[11px] font-bold text-emerald-400 uppercase flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> 一般公開中（実在提携宿）
          </span>
          <p className="text-3xl font-black text-emerald-300 font-mono mt-1">
            {stats.publishedRealCount}
          </p>
          <p className="text-[11px] text-emerald-200/70 mt-1">
            is_verified = true かつ実在宿のみ島ページに掲載
          </p>
        </div>

        <div className="bg-amber-950/30 border border-amber-700/50 rounded-2xl p-5 flex flex-col justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold text-amber-300 uppercase flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" /> 非公開・テスト/架空宿
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-3xl font-black text-amber-200 font-mono">
                {stats.testOrUnverifiedCount}
              </p>
              {stats.exposedTestCount > 0 && (
                <span className="text-[10px] font-bold bg-rose-600 text-white px-2 py-0.5 rounded-full">
                  要対応: 公開状態のテスト宿 {stats.exposedTestCount}件
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleBulkHideTestInns}
              className="flex-1 bg-amber-500 hover:bg-amber-400 text-gray-950 font-extrabold text-xs px-3 py-2 rounded-xl transition flex items-center justify-center gap-1.5"
            >
              <EyeOff className="w-3.5 h-3.5" />
              テスト・架空宿を一括非公開にする
            </button>
            <button
              type="button"
              onClick={handleBulkDeleteTestInns}
              className="bg-rose-950/70 hover:bg-rose-900 text-rose-200 border border-rose-800/70 font-bold text-[11px] px-2.5 py-2 rounded-xl transition"
              title="テスト・架空宿をDBから完全削除（最高管理者のみ）"
            >
              一括削除
            </button>
          </div>
        </div>
      </div>

      {/* B2B Partner Key Quick Reference Bar */}
      <div className="bg-gray-900/90 border border-blue-900/50 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="space-y-0.5">
          <p className="font-bold text-blue-300 flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5" />
            提携宿オーナー専用 B2Bポータル招待リンク（Admin権限から完全分離された専用キー）
          </p>
          <p className="font-mono text-[11px] text-gray-400 break-all">{B2B_PORTAL_INVITE_URL}</p>
        </div>
        <button
          type="button"
          onClick={() => handleCopyInviteLink()}
          className="shrink-0 bg-blue-600 hover:bg-blue-500 text-white font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition"
        >
          <Copy className="w-3.5 h-3.5" />
          招待リンクをコピー
        </button>
      </div>

      {/* Create / Edit Accommodation & B2B Owner Form */}
      {showForm && (
        <form
          onSubmit={handleSubmitForm}
          className="bg-gray-900 border border-amber-500/40 rounded-2xl p-6 shadow-2xl space-y-5 text-xs"
        >
          <div className="flex items-center justify-between border-b border-gray-800 pb-3">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              {formData.id ? '宿泊施設・オーナー情報の編集' : '新規提携宿・オーナー登録'}
            </h3>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-gray-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Searchable Island Selector */}
            <div className="space-y-1.5">
              <label className="block font-bold text-gray-300">対象島（全国離島マスター検索） *</label>
              <input
                type="text"
                value={islandSearch}
                onChange={(e) => setIslandSearch(e.target.value)}
                placeholder="島名・都道府県・IDで絞り込み（例: 石垣、青ヶ島、58）..."
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
              />
              <select
                value={formData.island_id}
                onChange={(e) => setFormData({ ...formData, island_id: e.target.value })}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500"
                required
              >
                {filteredMasterIslands.slice(0, 200).map((isl) => (
                  <option key={isl.id} value={isl.id}>
                    {isl.name}（{isl.prefecture} / ID:{isl.id}）
                  </option>
                ))}
              </select>
            </div>

            {/* Inn Name */}
            <div className="space-y-1.5">
              <label className="block font-bold text-gray-300">宿泊施設名 *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="例: 民宿 しまかぜ荘"
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500"
              />
              <p className="text-[10px] text-gray-500">
                ※テストデータの場合は名前に「テスト用」を含め、公開スイッチをOFFにしてください
              </p>
            </div>

            {/* Phone */}
            <div>
              <label className="block font-bold text-gray-300 mb-1">電話番号</label>
              <input
                type="text"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                placeholder="例: 0980-82-0000"
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2.5 text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Price Range */}
            <div>
              <label className="block font-bold text-gray-300 mb-1">料金目安</label>
              <input
                type="text"
                value={formData.price_range}
                onChange={(e) => setFormData({ ...formData, price_range: e.target.value })}
                placeholder="例: ¥9,500〜 / 1泊2食"
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Address */}
            <div>
              <label className="block font-bold text-gray-300 mb-1">所在地・住所</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="例: 沖縄県石垣市〇〇..."
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Website URL */}
            <div>
              <label className="block font-bold text-gray-300 mb-1">公式WebサイトURL（任意）</label>
              <input
                type="url"
                value={formData.website_url}
                onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                placeholder="https://..."
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2.5 text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Plan Tier */}
            <div>
              <label className="block font-bold text-gray-300 mb-1">掲載プラン区分 (plan_tier)</label>
              <select
                value={formData.plan_tier}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    plan_tier: e.target.value as FormState['plan_tier'],
                  })
                }
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500"
              >
                <option value="free">free（無料公的ディレクトリ枠）</option>
                <option value="paid_standard">paid_standard（公式提携スタンダード枠）</option>
                <option value="paid_premium">paid_premium（公式特選プレミアム枠）</option>
              </select>
            </div>

            {/* Booking Mode */}
            <div>
              <label className="block font-bold text-gray-300 mb-1">予約受付方式 (booking_mode)</label>
              <select
                value={formData.booking_mode}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    booking_mode: e.target.value as FormState['booking_mode'],
                  })
                }
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500"
              >
                <option value="request_based">request_based（リクエスト承認制・推奨）</option>
                <option value="instant_booking">instant_booking（即時予約確定）</option>
              </select>
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block font-bold text-gray-300 mb-1">施設紹介文（任意・後からオーナー画面でも編集可）</label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="島ならではの料理やおもてなしの特徴を入力..."
                className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex items-center justify-between bg-gray-950 border border-gray-800 rounded-xl p-3.5 cursor-pointer">
              <div>
                <span className="font-bold text-white block">一般公開する (is_verified)</span>
                <span className="text-[10px] text-gray-400">ONで島ページおよび /stay/[id] での予約受付を有効化</span>
              </div>
              <input
                type="checkbox"
                checked={formData.is_verified}
                onChange={(e) => setFormData({ ...formData, is_verified: e.target.checked })}
                className="w-4 h-4 accent-emerald-500"
              />
            </label>

            <label className="flex items-center justify-between bg-gray-950 border border-gray-800 rounded-xl p-3.5 cursor-pointer">
              <div>
                <span className="font-bold text-white block">港・空港の送迎対応あり (has_pickup)</span>
                <span className="text-[10px] text-gray-400">施設ページに送迎対応バッジを表示</span>
              </div>
              <input
                type="checkbox"
                checked={formData.has_pickup}
                onChange={(e) => setFormData({ ...formData, has_pickup: e.target.checked })}
                className="w-4 h-4 accent-blue-500"
              />
            </label>
          </div>

          {/* B2B Owner Account Provisioning Box */}
          <div className="bg-blue-950/30 border border-blue-800/60 rounded-2xl p-4 space-y-3">
            <div>
              <h4 className="font-bold text-blue-300 flex items-center gap-1.5">
                <UserPlus className="w-4 h-4" />
                B2B施設オーナーアカウントの発行・紐付け（任意）
              </h4>
              <p className="text-[11px] text-gray-400 mt-0.5">
                既存ユーザーのメールを入力すると自動で `role = owner` を付与して紐付けます。未登録メールの場合は初期パスワードを指定すると新規確認済みアカウントを即時作成します。
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-gray-300 mb-1">オーナー用メールアドレス</label>
                <input
                  type="email"
                  value={formData.owner_email}
                  onChange={(e) => setFormData({ ...formData, owner_email: e.target.value })}
                  placeholder="owner@inn-example.jp"
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-300 mb-1">
                  初期パスワード（新規アカウント作成時・6文字以上）
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.owner_password}
                    onChange={(e) => setFormData({ ...formData, owner_password: e.target.value })}
                    placeholder="既存ユーザーの場合は空欄可"
                    className="flex-1 bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, owner_password: generateInitialPassword() })
                    }
                    className="bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 px-3 py-2 rounded-xl font-bold whitespace-nowrap"
                  >
                    自動生成
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-5 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-gray-950 font-extrabold flex items-center gap-1.5 shadow-lg disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {submitting ? '保存中...' : formData.id ? '変更を保存する' : '提携宿を登録する'}
            </button>
          </div>
        </form>
      )}

      {/* Accommodations Table Card */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-800 pb-4">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: `すべて (${accommodations.length})` },
              { id: 'published', label: `公開中・実在宿 (${stats.publishedRealCount})` },
              { id: 'hidden', label: '非公開のみ' },
              { id: 'test', label: 'テスト・架空宿' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  statusFilter === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-950 text-gray-400 hover:text-gray-200 border border-gray-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              placeholder="施設名・島名・オーナーメール検索..."
              className="w-full bg-gray-950 border border-gray-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-gray-400">読み込み中...</div>
        ) : filteredRows.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-500">
            該当する宿泊施設はありません。「新規提携宿・オーナー登録」から追加できます。
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="border-b border-gray-800 text-gray-400 uppercase font-semibold">
                <tr>
                  <th className="py-2.5 pr-3">公開状態</th>
                  <th className="py-2.5 pr-3">施設名 / プラン</th>
                  <th className="py-2.5 pr-3">対象島</th>
                  <th className="py-2.5 pr-3">B2Bオーナー割当</th>
                  <th className="py-2.5 pr-3">連絡先 / 料金</th>
                  <th className="py-2.5 text-right">B2B招待・確認・操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/70">
                {filteredRows.map((acc) => {
                  const isTest =
                    Boolean(acc.is_test_inn) ||
                    acc.name.includes('架空') ||
                    acc.name.includes('テスト用');
                  const previewHref =
                    acc.is_verified && !isTest
                      ? `/stay/${encodeURIComponent(acc.id)}`
                      : `/stay/${encodeURIComponent(acc.id)}?preview=1`;

                  return (
                    <tr key={acc.id} className="hover:bg-gray-800/35 transition">
                      {/* Publish Toggle */}
                      <td className="py-3 pr-3 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleVerified(acc)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border transition ${
                            acc.is_verified
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-700 hover:bg-emerald-900'
                              : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700'
                          }`}
                        >
                          {acc.is_verified ? '● 公開中' : '○ 非公開'}
                        </button>
                      </td>

                      {/* Name & Tier */}
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-white text-sm">{acc.name}</span>
                          {isTest && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-700 text-[10px] font-bold">
                              テスト/架空
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 text-[10px]">
                          <span className="px-1.5 py-0.5 rounded bg-gray-800 text-gray-300 font-mono">
                            {acc.plan_tier}
                          </span>
                          <span className="text-gray-500 font-mono">
                            {acc.booking_mode === 'instant_booking' ? '即時確定' : '承認制'}
                          </span>
                        </div>
                      </td>

                      {/* Island */}
                      <td className="py-3 pr-3 whitespace-nowrap">
                        <span className="font-bold text-amber-300">
                          {acc.island_name || `島ID: ${acc.island_id}`}
                        </span>
                        {acc.island_prefecture && (
                          <span className="block text-[10px] text-gray-500">
                            {acc.island_prefecture} (ID:{acc.island_id})
                          </span>
                        )}
                      </td>

                      {/* Owner Assignment */}
                      <td className="py-3 pr-3">
                        {acc.owner_email ? (
                          <div>
                            <span className="font-mono text-blue-300 font-bold block">
                              {acc.owner_email}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setOwnerModalTarget(acc);
                                setOwnerModalEmail(acc.owner_email || '');
                                setOwnerModalPassword('');
                              }}
                              className="text-[10px] text-gray-400 hover:text-white underline mt-0.5"
                            >
                              変更・再割当
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setOwnerModalTarget(acc);
                              setOwnerModalEmail('');
                              setOwnerModalPassword(generateInitialPassword());
                            }}
                            className="px-2.5 py-1 rounded-lg bg-blue-950/70 hover:bg-blue-900 text-blue-300 border border-blue-800/70 text-[11px] font-bold inline-flex items-center gap-1"
                          >
                            <UserPlus className="w-3 h-3" />
                            オーナー割当
                          </button>
                        )}
                      </td>

                      {/* Phone & Price */}
                      <td className="py-3 pr-3 whitespace-nowrap">
                        <span className="font-mono text-gray-300 block">
                          {acc.phone_number || '-'}
                        </span>
                        <span className="text-[10px] text-gray-500 block">
                          {acc.price_range || '料金未設定'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 text-right whitespace-nowrap space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleCopyInviteLink(acc.owner_email, acc.name)}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/60 text-[11px] font-bold inline-flex items-center gap-1"
                          title="B2Bポータル招待リンクをコピー"
                        >
                          <Copy className="w-3 h-3" />
                          B2B招待
                        </button>

                        <a
                          href={previewHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 text-[11px] font-bold inline-flex items-center gap-1"
                          title="施設ページ (/stay/[id]) をプレビュー"
                        >
                          <ExternalLink className="w-3 h-3" />
                          LP確認
                        </a>

                        <button
                          type="button"
                          onClick={() => handleOpenEditForm(acc)}
                          className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-blue-300 border border-gray-700 inline-flex items-center"
                          title="編集"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(acc)}
                          className="p-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-900 text-rose-300 border border-rose-900/60 inline-flex items-center"
                          title="削除（最高管理者のみ）"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Owner Assignment Modal */}
      {ownerModalTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleAssignOwnerSubmit}
            className="bg-gray-900 border border-gray-800 rounded-2xl max-w-md w-full p-6 space-y-4 text-xs shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-blue-400" />
                B2Bオーナー割当・アカウント発行
              </h3>
              <button
                type="button"
                onClick={() => setOwnerModalTarget(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-gray-300">
              対象施設: <strong className="text-amber-300">{ownerModalTarget.name}</strong>
            </p>

            <div>
              <label className="block font-bold text-gray-400 mb-1">
                オーナーのメールアドレス（空欄で保存すると紐付け解除）
              </label>
              <input
                type="email"
                value={ownerModalEmail}
                onChange={(e) => setOwnerModalEmail(e.target.value)}
                placeholder="owner@example.com"
                className="w-full bg-gray-950 border border-gray-800 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-400 mb-1">
                初期パスワード（未登録メールの新規作成時のみ必要・6文字以上）
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={ownerModalPassword}
                  onChange={(e) => setOwnerModalPassword(e.target.value)}
                  placeholder="既存ユーザーの場合は空欄でOK"
                  className="flex-1 bg-gray-950 border border-gray-800 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setOwnerModalPassword(generateInitialPassword())}
                  className="bg-gray-800 hover:bg-gray-700 text-gray-200 px-3 py-2 rounded-xl font-bold border border-gray-700"
                >
                  生成
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setOwnerModalTarget(null)}
                className="px-4 py-2 rounded-xl bg-gray-800 text-gray-300 font-bold"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={assigningOwner}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold disabled:opacity-50"
              >
                {assigningOwner ? '処理中...' : 'オーナーを設定する'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
