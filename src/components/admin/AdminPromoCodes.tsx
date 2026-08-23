'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Gift, Copy, CheckCircle, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminPromoCodes() {
  const [codes, setCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchCodes = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('app_promo_codes').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      setCodes(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCodes();
  }, []);

  const handleGenerate = async () => {
    const customCode = window.prompt("発行するクーポンコードを入力してください（例: SUMMER2026）。\n空欄の場合は自動生成されます。");
    const amountStr = window.prompt("プレゼントする高画質チケットの枚数を入力してください（デフォルト: 1）", "1");
    const amount = parseInt(amountStr || '1', 10);
    const codeStr = customCode?.trim() || `TICKET-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    setGenerating(true);
    const { error } = await supabase.from('app_promo_codes').insert({
      code: codeStr,
      reward_amount: amount
    });
    setGenerating(false);

    if (error) {
      toast.error('発行に失敗しました。既に存在するコードの可能性があります。');
    } else {
      toast.success('コードを発行しました！');
      fetchCodes();
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Gift size={20} className="text-amber-500" />
          プレゼント用チケットコード (App Promo)
        </h3>
        <button onClick={handleGenerate} disabled={generating} className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors">
          <Plus size={16} /> 発行する
        </button>
      </div>

      {loading ? (
        <p className="text-slate-500 text-sm py-4 text-center">読み込み中...</p>
      ) : codes.length === 0 ? (
        <p className="text-slate-500 text-sm py-4 text-center">発行されたコードはありません。</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase">
                <th className="p-3 border-b border-slate-200">コード</th>
                <th className="p-3 border-b border-slate-200">付与チケット数</th>
                <th className="p-3 border-b border-slate-200">利用回数</th>
                <th className="p-3 border-b border-slate-200">作成日</th>
              </tr>
            </thead>
            <tbody>
              {codes.map(c => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="p-3 border-b border-slate-100 font-mono text-sm font-bold text-slate-700 flex items-center gap-2">
                    {c.code}
                    <button onClick={() => copyToClipboard(c.code, c.id)} className="text-slate-400 hover:text-blue-500">
                      {copiedId === c.id ? <CheckCircle size={14} className="text-green-500" /> : <Copy size={14} />}
                    </button>
                  </td>
                  <td className="p-3 border-b border-slate-100 text-sm">{c.reward_amount} 枚</td>
                  <td className="p-3 border-b border-slate-100 text-sm">{c.current_uses} / {c.max_uses || '∞'}</td>
                  <td className="p-3 border-b border-slate-100 text-xs text-slate-500">{new Date(c.created_at).toLocaleDateString('ja-JP')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
