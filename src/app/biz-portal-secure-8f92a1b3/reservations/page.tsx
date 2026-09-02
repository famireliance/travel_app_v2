'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Loader2, CalendarCheck, Ship, Check, X, Clock, MapPin, 
  AlertCircle, Users, Search, Filter, MessageSquare, ExternalLink,
  ChevronRight, ArrowUpRight, Sparkles, CheckCircle2
} from 'lucide-react';
import Link from 'next/link';

export default function BizPortalReservations() {
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState<any[]>([]);
  const [accId, setAccId] = useState<string | null>(null);
  const [accName, setAccName] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [replyModal, setReplyModal] = useState<{ resId: string, status: 'confirmed'|'rejected', reason?: string } | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState('');

  // 動的オリジンURL
  const getOrigin = () => {
    if (typeof window !== 'undefined' && window.location.origin) {
      return window.location.origin;
    }
    return 'https://island.kira-tabi.com';
  };

  // TEMPLATESを関数化し、動的なURLを埋め込めるようにする
  const getTemplates = (resId: string) => {
    const origin = getOrigin();
    return {
      confirmed: [
        { id: 'thanks', label: 'お礼とご挨拶', text: 'この度はご予約いただき、誠にありがとうございます。お会いできるのを楽しみにしております。' },
        { id: 'payment', label: '事前決済のご案内', text: '【事前決済について】\n当宿は事前決済制となっております。別途KIRATABIより送信される決済用リンクからお手続きをお願いいたします。' },
        { id: 'pickup', label: '送迎時間のお伺い', text: '【送迎について】\n港・ヘリポートまでの送迎をご希望の場合は、事前に到着便の時刻と便名をお知らせください。' },
        { id: 'pre_checkin', label: '事前チェックイン（宿帳登録）', text: `【事前チェックインのお願い】\n当日のチェックイン手続きをスムーズにするため、以下のURLから事前の宿泊者情報（宿泊台帳）登録にご協力をお願いいたします。\n${origin}/checkin/${resId}` }
      ],
      rejected: [
        { id: 'full', label: '満室のお詫び', text: '誠に申し訳ありません。あいにくご指定された日程は満室となっております。またの機会のご利用を心よりお待ちしております。' },
        { id: 'closed', label: '休業日のお詫び', text: '誠に申し訳ありません。ご指定の日程は当館の定期休業日となっております。' }
      ]
    };
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  async function fetchReservations() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data: acc } = await supabase
      .from('accommodations')
      .select('id, name')
      .eq('owner_id', user.id)
      .limit(1)
      .single();

    if (acc) {
      setAccId(acc.id);
      setAccName(acc.name || '');
      const { data: resData } = await supabase
        .from('reservations')
        .select(`
          *,
          user_profiles!guest_id(nickname, email)
        `)
        .eq('accommodation_id', acc.id)
        .order('created_at', { ascending: false });
      
      if (resData) setReservations(resData);
    }
    setLoading(false);
  }

  const handleActionClick = (id: string, status: string, reason?: string) => {
    if (status === 'cancelled') {
      if (!confirm(`ステータスを「${status}」に変更しますか？\n${reason === 'ferry_cancelled' ? '※欠航による無料キャンセル処理になります。' : ''}`)) return;
      executeStatusUpdate(id, status, reason);
    } else {
      setReplyModal({ resId: id, status: status as 'confirmed'|'rejected', reason });
      const initialText = getTemplates(id)[status as 'confirmed'|'rejected'][0].text;
      // 事前チェックインURLも合わせて自動セット
      const checkinUrlText = status === 'confirmed' ? `\n\n` + getTemplates(id).confirmed[3].text : '';
      setSelectedTemplate(initialText + checkinUrlText);
    }
  };

  const handleTemplateClick = (text: string) => {
    if (!selectedTemplate.includes(text.trim())) {
      setSelectedTemplate(prev => prev ? prev + '\n\n' + text : text);
    }
  };

  const executeStatusUpdate = async (id: string, status: string, reason?: string, message?: string) => {
    const updateData: any = { status };
    if (reason) updateData.cancellation_reason = reason;
    if (message) {
      updateData.internal_notes = `【ゲストへ送信案内済】\n${message}`; 
    }

    const { error } = await supabase.from('reservations').update(updateData).eq('id', id);
    if (!error) {
      setReplyModal(null);
      fetchReservations();
    } else {
      alert('更新に失敗しました: ' + error.message);
    }
  };

  // 統計情報
  const stats = useMemo(() => {
    const pendingCount = reservations.filter(r => r.status === 'pending').length;
    const confirmedCount = reservations.filter(r => r.status === 'confirmed').length;
    const cancelledCount = reservations.filter(r => r.status === 'cancelled').length;
    return {
      total: reservations.length,
      pending: pendingCount,
      confirmed: confirmedCount,
      cancelled: cancelledCount
    };
  }, [reservations]);

  // フィルタリング
  const filteredReservations = useMemo(() => {
    return reservations.filter(res => {
      // ステータス絞り込み
      if (statusFilter === 'pending' && res.status !== 'pending') return false;
      if (statusFilter === 'confirmed' && res.status !== 'confirmed') return false;
      if (statusFilter === 'cancelled' && res.status !== 'cancelled' && res.status !== 'rejected') return false;

      // 検索ワード
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const guestName = res.user_profiles?.nickname?.toLowerCase() || '';
        const email = res.user_profiles?.email?.toLowerCase() || '';
        const notes = res.guest_notes?.toLowerCase() || '';
        const resId = res.id.toLowerCase();
        return guestName.includes(query) || email.includes(query) || notes.includes(query) || resId.includes(query);
      }

      return true;
    });
  }, [reservations, statusFilter, searchQuery]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        <span className="text-xs text-slate-400 font-bold tracking-widest uppercase">Loading Reservations...</span>
      </div>
    );
  }

  if (!accId) {
    return (
      <div className="p-8 bg-white rounded-3xl shadow-sm border border-slate-200 text-center space-y-3">
        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mx-auto">
          <CalendarCheck className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-slate-800">宿泊施設が紐付けられていません</h3>
        <p className="text-xs text-slate-500">アカウントに紐付く宿情報を確認してください。</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Top Title & Stats Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[0.65rem] font-bold tracking-widest text-amber-600 uppercase block mb-1">
            RESERVATION MANAGEMENT
          </span>
          <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 font-serif flex items-center gap-2.5">
            <CalendarCheck className="w-7 h-7 text-amber-500" />
            予約管理 ＆ リクエスト承認
          </h2>
        </div>

        {accId && (
          <Link
            href={`/stay/${accId}`}
            target="_blank"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
          >
            <span>公開中の宿ページを確認</span>
            <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
          </Link>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[0.65rem] text-slate-400 font-bold uppercase tracking-wider block mb-1">全予約数</span>
          <span className="font-mono font-bold text-2xl text-slate-900">{stats.total}</span>
        </div>
        <div className={`p-4 rounded-2xl border shadow-sm transition-all ${stats.pending > 0 ? 'bg-amber-500/10 border-amber-300 ring-2 ring-amber-400/40' : 'bg-white border-slate-200'}`}>
          <span className="text-[0.65rem] text-amber-800 font-bold uppercase tracking-wider block mb-1 flex items-center justify-between">
            承認待ち
            {stats.pending > 0 && <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />}
          </span>
          <span className="font-mono font-bold text-2xl text-amber-700">{stats.pending}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[0.65rem] text-emerald-700 font-bold uppercase tracking-wider block mb-1">予約確定済</span>
          <span className="font-mono font-bold text-2xl text-emerald-600">{stats.confirmed}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[0.65rem] text-slate-500 font-bold uppercase tracking-wider block mb-1">キャンセル・欠航</span>
          <span className="font-mono font-bold text-2xl text-slate-600">{stats.cancelled}</span>
        </div>
      </div>

      {/* 欠航サポート案内バナー */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 p-4 rounded-2xl text-white shadow-md flex items-start gap-3 border border-blue-500/30">
        <Ship className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed">
          <strong className="text-amber-300 block mb-0.5">【重要】 フェリー・ヘリ欠航時のワンタップ免除対応</strong>
          悪天候によりゲストが来島不可能な場合、該当予約カードの「欠航キャンセル」ボタンを押すことで、キャンセル料無料免除ステータスが自動付与されます。
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar w-full sm:w-auto">
          {[
            { id: 'all', label: `すべて (${stats.total})` },
            { id: 'pending', label: `承認待ち (${stats.pending})` },
            { id: 'confirmed', label: `確定 (${stats.confirmed})` },
            { id: 'cancelled', label: `キャンセル (${stats.cancelled})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Box */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ゲスト名・予約IDで検索..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* Reservation List */}
      {filteredReservations.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl shadow-sm border border-slate-200 text-center space-y-3">
          <CalendarCheck className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-slate-600 font-bold text-sm">該当する予約データはありません</p>
          <p className="text-xs text-slate-400">Web予約リクエストが届くと、ここにリアルタイムで表示されます。</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReservations.map((res) => (
            <div key={res.id} className="bg-white rounded-3xl shadow-sm border border-slate-200/90 overflow-hidden hover:shadow-md transition-shadow">
              
              {/* Card Header Status Strip */}
              <div className={`px-5 py-2.5 flex items-center justify-between text-xs font-bold text-white ${
                res.status === 'pending' ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950' :
                res.status === 'confirmed' ? 'bg-emerald-600' :
                res.status === 'cancelled' && res.cancellation_reason === 'ferry_cancelled' ? 'bg-blue-600' :
                'bg-slate-600'
              }`}>
                <div className="flex items-center gap-2">
                  {res.status === 'pending' && <Clock className="w-4 h-4" />}
                  {res.status === 'confirmed' && <Check className="w-4 h-4" />}
                  {res.status === 'cancelled' && res.cancellation_reason === 'ferry_cancelled' && <Ship className="w-4 h-4" />}
                  <span className="tracking-wide">
                    {res.status === 'pending' ? '⚡ 承認待ちリクエスト' :
                     res.status === 'confirmed' ? '✓ 予約確定済み' :
                     res.status === 'cancelled' && res.cancellation_reason === 'ferry_cancelled' ? '船・ヘリ欠航 (キャンセル料無料)' :
                     res.status === 'rejected' ? 'お断り済み' : 'キャンセル済み'}
                  </span>
                </div>
                <span className="font-mono text-[0.7rem] opacity-90">ID: {res.id.substring(0, 8)}</span>
              </div>
              
              {/* Card Body */}
              <div className="p-6 flex flex-col lg:flex-row gap-6">
                <div className="flex-1 space-y-4">
                  
                  {/* Guest & Party Info */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-[0.65rem] text-slate-400 font-bold uppercase tracking-wider block">
                        宿泊代表者 (KIRATABI 会員)
                      </span>
                      <h4 className="text-lg font-serif font-bold text-slate-900 flex items-center gap-2">
                        <span>{res.user_profiles?.nickname || 'ゲスト'}</span>
                        {res.user_profiles?.email && (
                          <span className="text-xs font-mono text-slate-500 font-normal">({res.user_profiles.email})</span>
                        )}
                      </h4>
                    </div>

                    <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/80 flex items-center gap-1.5 font-bold text-xs text-slate-800">
                      <Users className="w-3.5 h-3.5 text-blue-500" />
                      <span>{res.guest_count} 名様</span>
                    </div>
                  </div>

                  {/* Dates Banner */}
                  <div className="bg-gradient-to-r from-slate-50 to-blue-50/40 p-3.5 rounded-2xl border border-slate-200/70 flex items-center justify-around text-center">
                    <div>
                      <p className="text-[0.65rem] text-slate-400 font-bold tracking-widest uppercase">CHECK-IN</p>
                      <p className="font-mono font-bold text-slate-900 text-sm md:text-base">
                        {new Date(res.check_in_date).toLocaleDateString('ja-JP')}
                      </p>
                    </div>
                    <div className="text-slate-300 font-bold">〜</div>
                    <div>
                      <p className="text-[0.65rem] text-slate-400 font-bold tracking-widest uppercase">CHECK-OUT</p>
                      <p className="font-mono font-bold text-slate-900 text-sm md:text-base">
                        {new Date(res.check_out_date).toLocaleDateString('ja-JP')}
                      </p>
                    </div>
                  </div>

                  {/* Notes / Plan Info */}
                  {res.guest_notes && (
                    <div className="text-xs bg-blue-50/60 p-3.5 rounded-2xl border border-blue-100/80 space-y-1">
                      <strong className="text-blue-900 flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5 text-blue-600" /> ゲストからのご要望・選択プラン:
                      </strong>
                      <p className="text-slate-700 whitespace-pre-wrap font-serif leading-relaxed">
                        {res.guest_notes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Right Action Box */}
                <div className="w-full lg:w-56 shrink-0 flex flex-col justify-center gap-2 border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-6">
                  {res.status === 'pending' && (
                    <>
                      <button 
                        onClick={() => handleActionClick(res.id, 'confirmed')} 
                        className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all hover:scale-102"
                      >
                        <Check className="w-4 h-4" /> 予約を承認する
                      </button>
                      <button 
                        onClick={() => handleActionClick(res.id, 'rejected', 'owner_request')} 
                        className="w-full py-2.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <X className="w-4 h-4" /> お断りする
                      </button>
                    </>
                  )}

                  {res.status === 'confirmed' && (
                    <>
                      <button 
                        onClick={() => handleActionClick(res.id, 'cancelled', 'ferry_cancelled')} 
                        className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all"
                      >
                        <Ship className="w-4 h-4 text-amber-300" /> 欠航キャンセル処理
                      </button>
                      <button 
                        onClick={() => handleActionClick(res.id, 'cancelled', 'guest_request')} 
                        className="w-full py-2 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 text-xs font-bold rounded-xl shadow-sm transition-colors"
                      >
                        通常のキャンセル
                      </button>
                    </>
                  )}
                  
                  {(res.status === 'cancelled' || res.status === 'rejected') && (
                    <div className="py-4 text-center text-slate-400 text-xs font-bold bg-slate-50 rounded-xl border border-slate-100">
                      対応完了
                    </div>
                  )}
                </div>

              </div>
            </div>
          ))}
        </div>
      )}

      {/* スマート定型文 & メッセージ送信モーダル */}
      {replyModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-100">
            <div className={`px-6 py-4 border-b text-white flex items-center justify-between ${
              replyModal.status === 'confirmed' ? 'bg-gradient-to-r from-emerald-600 to-teal-700' : 'bg-gradient-to-r from-rose-600 to-red-700'
            }`}>
              <h3 className="font-bold flex items-center gap-2">
                {replyModal.status === 'confirmed' ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                {replyModal.status === 'confirmed' ? '予約の承認とゲストへのご案内' : '予約のお断りとメッセージ送信'}
              </h3>
              <button onClick={() => setReplyModal(null)} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">
                  1. スマート定型文（クリックでメッセージ欄に追加されます）
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {replyModal && getTemplates(replyModal.resId)[replyModal.status].map(t => (
                    <button
                      key={t.id}
                      onClick={() => handleTemplateClick(t.text)}
                      className="px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors bg-slate-50 text-slate-700 border-slate-200 hover:bg-amber-50 hover:text-amber-900 hover:border-amber-300"
                    >
                      + {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">2. 送信メッセージ内容</label>
                <textarea
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="w-full h-44 p-3.5 text-xs md:text-sm border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 bg-slate-50 leading-relaxed outline-none transition-all font-serif resize-none"
                  placeholder="メッセージを入力してください..."
                />
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-3">
                <div className="flex flex-col gap-2.5">
                  <button
                    onClick={() => {
                      const res = reservations.find(r => r.id === replyModal?.resId);
                      const email = res?.user_profiles?.email || '';
                      if (email) {
                        window.location.href = `mailto:${email}?subject=${encodeURIComponent(`【${accName || 'KIRATABI'}】宿泊予約についてのご案内`)}&body=${encodeURIComponent(selectedTemplate)}`;
                      }
                      executeStatusUpdate(replyModal.resId, replyModal.status, replyModal.reason, selectedTemplate);
                    }}
                    className={`w-full py-3.5 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 ${
                      replyModal.status === 'confirmed' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                    }`}
                  >
                    ✉️ メールアプリを起動して承認送信 (推奨)
                  </button>

                  <button
                    onClick={() => {
                      window.location.href = `line://msg/text/${encodeURIComponent(selectedTemplate)}`;
                      executeStatusUpdate(replyModal.resId, replyModal.status, replyModal.reason, selectedTemplate);
                    }}
                    className="w-full py-2.5 bg-[#06C755] hover:bg-[#05b34c] text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    💬 LINEアプリを開いて送信
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

