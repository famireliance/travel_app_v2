'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, CalendarCheck, Ship, Check, X, Clock, MapPin, AlertCircle } from 'lucide-react';

export default function BizPortalReservations() {
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState<any[]>([]);
  const [accId, setAccId] = useState<string | null>(null);
  const [replyModal, setReplyModal] = useState<{ resId: string, status: 'confirmed'|'rejected', reason?: string } | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState('');

  // TEMPLATESを関数化し、動的なURLを埋め込めるようにする
  const getTemplates = (resId: string) => ({
    confirmed: [
      { id: 'thanks', label: 'お礼とご挨拶', text: 'この度はご予約いただき、誠にありがとうございます。お会いできるのを楽しみにしております。' },
      { id: 'payment', label: '事前決済のご案内', text: '【事前決済について】\n当宿は事前決済制となっております。別途KIRATABIより送信される決済用リンクからお手続きをお願いいたします。' },
      { id: 'pickup', label: '送迎時間のお伺い', text: '【送迎について】\n港・ヘリポートまでの送迎をご希望の場合は、事前に到着便の時間をお知らせください。' },
      { id: 'pre_checkin', label: '事前チェックイン', text: `【事前チェックイン】\n当日の手続きをスムーズにするため、以下のURLから事前の宿泊者情報（宿泊台帳）登録にご協力をお願いいたします。\nhttp://localhost:3000/checkin/${resId}` }
    ],
    rejected: [
      { id: 'full', label: '満室のお詫び', text: '誠に申し訳ありません。あいにくご指定された日程は満室となっております。またの機会をお待ちしております。' },
      { id: 'closed', label: '休業日のお詫び', text: '誠に申し訳ありません。ご指定の日程は当館の休業日となっております。' }
    ]
  });

  useEffect(() => {
    fetchReservations();
  }, []);

  async function fetchReservations() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: acc } = await supabase.from('accommodations').select('id').eq('owner_id', user.id).limit(1).single();
    if (acc) {
      setAccId(acc.id);
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
      setSelectedTemplate(getTemplates(id)[status as 'confirmed'|'rejected'][0].text);
    }
  };

  const handleTemplateClick = (text: string) => {
    // 既に含まれていない場合のみ末尾に改行して追記
    if (!selectedTemplate.includes(text.trim())) {
      setSelectedTemplate(prev => prev ? prev + '\n\n' + text : text);
    }
  };

  const executeStatusUpdate = async (id: string, status: string, reason?: string, message?: string) => {
    const updateData: any = { status };
    if (reason) updateData.cancellation_reason = reason;
    if (message) {
      // 本来は別テーブル(messages)に入れますが、MVPとしてinternal_notesに追記して履歴を残します
      updateData.internal_notes = `【ゲストへ自動送信済】\n${message}`; 
    }

    const { error } = await supabase.from('reservations').update(updateData).eq('id', id);
    if (!error) {
      setReplyModal(null);
      fetchReservations();
    } else {
      alert('更新に失敗しました: ' + error.message);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-slate-300" /></div>;
  }

  if (!accId) {
    return <div className="p-4 bg-white rounded-xl shadow-sm text-center">宿泊施設が紐付けられていません。</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900 font-serif flex items-center gap-2">
          <CalendarCheck className="w-6 h-6 text-amber-500" />
          予約管理・リクエスト承認
        </h2>
      </div>

      <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3 shadow-sm mb-6">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-900 font-medium">
          <strong>【重要】 船・飛行機の欠航対応について</strong><br/>
          悪天候によりゲストが来島不可能な場合、各予約カードの「欠航キャンセル」ボタンを押してください。システム側で自動的にキャンセル料免除処理が行われます。
        </div>
      </div>

      {reservations.length === 0 ? (
        <div className="bg-white p-10 rounded-2xl shadow-sm border border-slate-100 text-center">
          <CalendarCheck className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 font-bold">現在、予約データはありません。</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reservations.map((res) => (
            <div key={res.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className={`p-3 flex items-center justify-between text-xs font-bold text-white ${
                res.status === 'pending' ? 'bg-amber-500' :
                res.status === 'confirmed' ? 'bg-emerald-600' :
                res.status === 'cancelled' && res.cancellation_reason === 'ferry_cancelled' ? 'bg-blue-600' :
                'bg-slate-400'
              }`}>
                <div className="flex items-center gap-2">
                  {res.status === 'pending' && <Clock className="w-4 h-4" />}
                  {res.status === 'confirmed' && <Check className="w-4 h-4" />}
                  {res.status === 'cancelled' && res.cancellation_reason === 'ferry_cancelled' && <Ship className="w-4 h-4" />}
                  <span>
                    {res.status === 'pending' ? '承認待ちリクエスト' :
                     res.status === 'confirmed' ? '予約確定済み' :
                     res.status === 'cancelled' && res.cancellation_reason === 'ferry_cancelled' ? '無料キャンセル (欠航)' :
                     res.status === 'rejected' ? 'お断り済み' : 'キャンセル済み'}
                  </span>
                </div>
                <span>予約ID: {res.id.substring(0, 8)}</span>
              </div>
              
              <div className="p-5 flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs text-slate-500 font-bold mb-1">ゲスト名 (KIRATABI ユーザー)</p>
                      <p className="text-lg font-bold text-slate-900">{res.user_profiles?.nickname || '匿名ゲスト'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500 font-bold mb-1">宿泊人数</p>
                      <p className="text-lg font-bold text-slate-900">{res.guest_count} 名</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-around text-center">
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">Check-in</p>
                      <p className="font-bold text-slate-800">{new Date(res.check_in_date).toLocaleDateString('ja-JP')}</p>
                    </div>
                    <div className="flex items-center text-slate-300">〜</div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">Check-out</p>
                      <p className="font-bold text-slate-800">{new Date(res.check_out_date).toLocaleDateString('ja-JP')}</p>
                    </div>
                  </div>

                  {res.guest_notes && (
                    <div className="text-sm bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                      <strong className="text-blue-800 text-xs block mb-1">ゲストからのメッセージ:</strong>
                      <p className="text-slate-700">{res.guest_notes}</p>
                    </div>
                  )}
                </div>

                {/* アクションボタン */}
                <div className="w-full md:w-48 shrink-0 flex flex-col gap-2 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                  {res.status === 'pending' && (
                    <>
                      <button onClick={() => handleActionClick(res.id, 'confirmed')} className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-xl shadow-sm flex items-center justify-center gap-2">
                        <Check className="w-4 h-4" /> 予約を承認する
                      </button>
                      <button onClick={() => handleActionClick(res.id, 'rejected', 'owner_request')} className="w-full py-2 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 text-sm font-bold rounded-xl shadow-sm flex items-center justify-center gap-2">
                        <X className="w-4 h-4" /> お断りする
                      </button>
                    </>
                  )}

                  {res.status === 'confirmed' && (
                    <>
                      <button onClick={() => handleActionClick(res.id, 'cancelled', 'ferry_cancelled')} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-sm flex items-center justify-center gap-2">
                        <Ship className="w-4 h-4" /> 欠航キャンセル処理
                      </button>
                      <button onClick={() => handleActionClick(res.id, 'cancelled', 'guest_request')} className="w-full py-2 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 text-xs font-bold rounded-xl shadow-sm mt-2">
                        通常のキャンセル
                      </button>
                    </>
                  )}
                  
                  {(res.status === 'cancelled' || res.status === 'rejected') && (
                    <div className="h-full flex items-center justify-center text-slate-400 text-sm font-bold">
                      対応完了
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* スマート定型文モーダル */}
      {replyModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className={`px-6 py-4 border-b text-white flex items-center justify-between ${replyModal.status === 'confirmed' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
              <h3 className="font-bold">
                {replyModal.status === 'confirmed' ? '予約の承認とメッセージ送信' : '予約のお断りとメッセージ送信'}
              </h3>
              <button onClick={() => setReplyModal(null)} className="p-1 hover:bg-white/20 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">1. スマート定型文を選択（クリックで本文に追記されます）</label>
                <div className="flex flex-wrap gap-2">
                  {replyModal && getTemplates(replyModal.resId)[replyModal.status].map(t => (
                    <button
                      key={t.id}
                      onClick={() => handleTemplateClick(t.text)}
                      className="px-3 py-1.5 text-xs font-bold rounded-full border transition-colors bg-white text-slate-600 border-slate-300 hover:bg-slate-50 hover:border-slate-400 active:bg-slate-100"
                    >
                      + {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">2. メッセージ内容</label>
                <textarea
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="w-full h-40 p-3 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-slate-50 leading-relaxed"
                  placeholder="メッセージを入力してください..."
                />
              </div>

              <div className="pt-2 border-t border-slate-100">
                <p className="text-[10px] text-amber-700 font-bold mb-3 bg-amber-50 p-2 rounded flex items-start gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  ※初回連絡はメールを強く推奨します（LINEはゲストが事前に宿の公式アカウントを友だち登録していないと届きません）。
                </p>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => {
                      const res = reservations.find(r => r.id === replyModal?.resId);
                      const email = res?.user_profiles?.email || '';
                      window.location.href = `mailto:${email}?subject=${encodeURIComponent('KIRATABI 宿泊予約についてのご案内')}&body=${encodeURIComponent(selectedTemplate)}`;
                      executeStatusUpdate(replyModal.resId, replyModal.status, replyModal.reason, selectedTemplate);
                    }}
                    className={`w-full py-3 text-white font-bold rounded-xl shadow-sm transition-transform hover:scale-102 flex items-center justify-center gap-2 ${
                      replyModal.status === 'confirmed' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                    }`}
                  >
                    ✉️ メールアプリを起動して送信 (推奨)
                  </button>

                  <button
                    onClick={() => {
                      // LINE URL scheme (スマホのみ機能する場合があるためクリップボードも併用推奨)
                      window.location.href = `line://msg/text/${encodeURIComponent(selectedTemplate)}`;
                      executeStatusUpdate(replyModal.resId, replyModal.status, replyModal.reason, selectedTemplate);
                    }}
                    className="w-full py-2.5 bg-[#06C755] hover:bg-[#05b34c] text-white font-bold rounded-xl shadow-sm flex items-center justify-center gap-2"
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
