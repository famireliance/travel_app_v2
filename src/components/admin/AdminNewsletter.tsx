'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Mail, Send, AlertCircle, History } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminNewsletter({ adminPassword }: { adminPassword: string }) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [targetTier, setTargetTier] = useState('all');
  const [promoCodeId, setPromoCodeId] = useState('');
  
  const [promoCodes, setPromoCodes] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsLoading(true);
    // Fetch promo codes
    const { data: codes } = await supabase.from('app_promo_codes').select('id, code, reward_amount').order('created_at', { ascending: false });
    if (codes) setPromoCodes(codes);

    // Fetch history
    const { data: hist } = await supabase.from('newsletters').select('*, app_promo_codes(code)').order('sent_at', { ascending: false }).limit(10);
    if (hist) setHistory(hist);
    
    setIsLoading(false);
  };

  const handleInsertCode = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    setPromoCodeId(selectedId);
    
    if (selectedId) {
      const selected = promoCodes.find(c => c.id === selectedId);
      if (selected) {
        setBody(prev => prev + `\n\n🎁 プレゼントコード: ${selected.code}\nマイページの設定タブからご入力ください！`);
      }
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) {
      toast.error('件名と本文を入力してください');
      return;
    }

    if (!confirm('本当にこの内容で一斉送信しますか？この操作は取り消せません。')) {
      return;
    }

    setIsSending(true);
    const toastId = toast.loading('配信中...');

    try {
      const res = await fetch('/api/admin/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': adminPassword
        },
        body: JSON.stringify({
          subject,
          body,
          targetTier,
          promoCodeId: promoCodeId || null
        })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || '配信エラー');
      }

      toast.success(`${data.sentCount}件のメールを送信しました！`, { id: toastId });
      setSubject('');
      setBody('');
      setPromoCodeId('');
      fetchInitialData();
    } catch (err: any) {
      toast.error(err.message, { id: toastId });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6">
          <Mail size={20} className="text-blue-500" />
          新規メルマガ配信
        </h3>

        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">配信ターゲット</label>
            <select
              value={targetTier}
              onChange={e => setTargetTier(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">すべてのユーザー</option>
              <option value="free">Freeプランのみ (無料ユーザー)</option>
              <option value="premium">Premiumプランのみ</option>
              <option value="ultimate">Ultimateプランのみ</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">件名 (Subject)</label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="例: 【KIRATABI】夏のお出かけ応援クーポンプレゼント！"
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">プレゼントコードの添付 (任意)</label>
            <select
              value={promoCodeId}
              onChange={handleInsertCode}
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">-- コードを添付しない --</option>
              {promoCodes.map(c => (
                <option key={c.id} value={c.id}>{c.code} (高画質枠: {c.reward_amount}枚)</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">本文 (Text)</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="メール本文を入力..."
              rows={8}
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              required
            />
          </div>

          <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex items-start gap-3">
            <AlertCircle size={18} className="text-amber-600 mt-0.5 shrink-0" />
            <div className="text-sm text-amber-800">
              <p className="font-bold mb-1">送信に関する注意事項</p>
              <ul className="list-disc pl-4 space-y-1 text-xs">
                <li>送信元アドレスは環境変数 <code>RESEND_FROM_EMAIL</code>（未設定時はテスト用）になります。</li>
                <li>「送信する」を押すと、BCCを利用して安全に一斉送信が行われます。取り消しはできません。</li>
              </ul>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSending}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-lg shadow-md transition-colors flex justify-center items-center gap-2"
          >
            {isSending ? '送信処理中...' : <><Send size={18} /> 一斉送信を実行する</>}
          </button>
        </form>
      </div>

      {/* History */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
          <History size={20} className="text-slate-500" />
          最近の配信履歴 (直近10件)
        </h3>
        
        {isLoading ? (
          <p className="text-sm text-slate-500">読み込み中...</p>
        ) : history.length === 0 ? (
          <p className="text-sm text-slate-500">配信履歴はありません。</p>
        ) : (
          <div className="space-y-4">
            {history.map(h => (
              <div key={h.id} className="p-4 border border-slate-100 rounded-lg bg-slate-50">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-slate-800">{h.subject}</h4>
                  <span className="text-xs text-slate-500">{new Date(h.sent_at).toLocaleString('ja-JP')}</span>
                </div>
                <div className="flex gap-4 text-xs text-slate-600 mb-2">
                  <span className="bg-white px-2 py-1 rounded border border-slate-200">ターゲット: {h.target_tier.toUpperCase()}</span>
                  <span className="bg-white px-2 py-1 rounded border border-slate-200">送信数: {h.sent_count} 件</span>
                  {h.app_promo_codes && (
                    <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded border border-amber-200">
                      🎁 {h.app_promo_codes.code}
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500 whitespace-pre-wrap max-h-24 overflow-y-auto bg-white p-2 border border-slate-200 rounded">
                  {h.body}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
