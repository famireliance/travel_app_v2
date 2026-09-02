'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, BookOpen, Printer, Search, Download, ShieldCheck } from 'lucide-react';

export default function BizPortalLedger() {
  const [loading, setLoading] = useState(true);
  const [ledgers, setLedgers] = useState<any[]>([]);
  const [accId, setAccId] = useState<string | null>(null);
  const [accName, setAccName] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchLedgers();
  }, []);

  async function fetchLedgers() {
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
      const { data: ledgerData } = await supabase
        .from('guest_ledgers')
        .select(`
          *,
          reservations(check_in_date, check_out_date, guest_count)
        `)
        .eq('accommodation_id', acc.id)
        .order('created_at', { ascending: false });
      
      if (ledgerData) setLedgers(ledgerData);
    }
    setLoading(false);
  }

  const handlePrint = () => {
    window.print();
  };

  const filteredLedgers = useMemo(() => {
    if (!searchQuery.trim()) return ledgers;
    const q = searchQuery.toLowerCase();
    return ledgers.filter(l => 
      (l.name && l.name.toLowerCase().includes(q)) ||
      (l.address && l.address.toLowerCase().includes(q)) ||
      (l.occupation && l.occupation.toLowerCase().includes(q)) ||
      (l.previous_location && l.previous_location.toLowerCase().includes(q)) ||
      (l.next_location && l.next_location.toLowerCase().includes(q))
    );
  }, [ledgers, searchQuery]);

  const handleExportCSV = () => {
    if (filteredLedgers.length === 0) {
      alert('エクスポート対象のデータがありません。');
      return;
    }

    const headers = ['チェックイン日', 'チェックアウト日', '宿泊人数', '氏名', '年齢', '職業', '住所', '前泊地', '次泊地', '登録日時'];
    const rows = filteredLedgers.map(l => [
      l.reservations?.check_in_date || '',
      l.reservations?.check_out_date || '',
      l.reservations?.guest_count ? `${l.reservations.guest_count}名` : '',
      l.name || '',
      l.age ? `${l.age}歳` : '',
      l.occupation || '',
      `"${(l.address || '').replace(/"/g, '""')}"`,
      `"${(l.previous_location || '').replace(/"/g, '""')}"`,
      `"${(l.next_location || '').replace(/"/g, '""')}"`,
      l.created_at ? new Date(l.created_at).toLocaleString('ja-JP') : ''
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `宿泊台帳_${accName || 'KIRATABI'}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Loading Ledgers...</span>
      </div>
    );
  }

  if (!accId) {
    return (
      <div className="p-8 bg-white rounded-3xl shadow-sm border border-slate-200 text-center space-y-3">
        <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
        <p className="font-bold text-slate-700">宿泊施設が紐付けられていません。</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[0.65rem] font-bold tracking-widest text-indigo-600 uppercase block mb-1">
            RYOKAN BUSINESS ACT COMPLIANT
          </span>
          <h2 className="text-2xl font-bold text-slate-900 font-serif flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-600" />
            オンライン宿泊者名簿（宿泊台帳）
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            旅館業法第6条に基づく宿泊者情報の事前登録データ一覧です。法令保管用CSV出力・印刷に対応しています。
          </p>
        </div>
        <div className="flex gap-2 print:hidden">
          <button 
            onClick={handleExportCSV} 
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Download className="w-4 h-4" /> CSV出力
          </button>
          <button 
            onClick={handlePrint} 
            className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Printer className="w-4 h-4" /> 印刷
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/70 print:hidden">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="氏名・住所・職業などで検索..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
            />
          </div>
          <div className="text-xs text-slate-500 font-mono">
            登録件数: <strong className="text-slate-800 font-bold">{filteredLedgers.length}</strong> 件
          </div>
        </div>

        {filteredLedgers.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-medium space-y-3">
            <BookOpen className="w-12 h-12 text-slate-200 mx-auto" />
            <p className="font-bold text-slate-700 text-sm">宿泊台帳データはありません</p>
            <p className="text-xs text-slate-400">ゲストが事前チェックインを送信すると、ここに自動反映されます。</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 whitespace-nowrap">チェックイン</th>
                  <th className="px-4 py-3 whitespace-nowrap">氏名</th>
                  <th className="px-4 py-3 whitespace-nowrap">年齢</th>
                  <th className="px-4 py-3 whitespace-nowrap">職業</th>
                  <th className="px-4 py-3 min-w-[200px]">ご住所</th>
                  <th className="px-4 py-3 whitespace-nowrap">前泊地</th>
                  <th className="px-4 py-3 whitespace-nowrap">次泊地</th>
                  <th className="px-4 py-3 whitespace-nowrap">人数</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLedgers.map((ledger) => (
                  <tr key={ledger.id} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap font-mono">
                      {ledger.reservations?.check_in_date ? new Date(ledger.reservations.check_in_date).toLocaleDateString('ja-JP') : '-'}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap">{ledger.name}</td>
                    <td className="px-4 py-3 whitespace-nowrap font-mono">{ledger.age}歳</td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-700">{ledger.occupation}</td>
                    <td className="px-4 py-3 text-slate-600">{ledger.address}</td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{ledger.previous_location}</td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{ledger.next_location}</td>
                    <td className="px-4 py-3 font-medium whitespace-nowrap">{ledger.reservations?.guest_count || '-'} 名</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .space-y-6, .space-y-6 * {
            visibility: visible;
          }
          .space-y-6 {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}} />
    </div>
  );
}

