'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, BookOpen, Printer, Search, Download } from 'lucide-react';

export default function BizPortalLedger() {
  const [loading, setLoading] = useState(true);
  const [ledgers, setLedgers] = useState<any[]>([]);
  const [accId, setAccId] = useState<string | null>(null);

  useEffect(() => {
    fetchLedgers();
  }, []);

  async function fetchLedgers() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: acc } = await supabase.from('accommodations').select('id').eq('owner_id', user.id).limit(1).single();
    if (acc) {
      setAccId(acc.id);
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

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-slate-300" /></div>;
  }

  if (!accId) {
    return <div className="p-4 bg-white rounded-xl shadow-sm text-center">宿泊施設が紐付けられていません。</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 font-serif flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-600" />
            オンライン宿泊台帳
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            旅館業法に基づく宿泊者情報の事前登録データ一覧です。
          </p>
        </div>
        <div className="flex gap-3 print:hidden">
          <button onClick={handlePrint} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-50 flex items-center gap-2 shadow-sm">
            <Printer className="w-4 h-4" />
            印刷する
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 print:hidden">
          <div className="relative w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="氏名や日付で検索..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button className="text-sm font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
            <Download className="w-4 h-4" /> CSVダウンロード
          </button>
        </div>

        {ledgers.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-bold">
            <BookOpen className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            まだ登録された宿泊台帳はありません。
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">チェックイン</th>
                  <th className="px-4 py-3">氏名</th>
                  <th className="px-4 py-3">年齢</th>
                  <th className="px-4 py-3">職業</th>
                  <th className="px-4 py-3">住所</th>
                  <th className="px-4 py-3">前泊地</th>
                  <th className="px-4 py-3">次泊地</th>
                  <th className="px-4 py-3">人数</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ledgers.map((ledger) => (
                  <tr key={ledger.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">
                      {ledger.reservations?.check_in_date ? new Date(ledger.reservations.check_in_date).toLocaleDateString('ja-JP') : '-'}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900">{ledger.name}</td>
                    <td className="px-4 py-3">{ledger.age}歳</td>
                    <td className="px-4 py-3">{ledger.occupation}</td>
                    <td className="px-4 py-3 text-xs text-slate-600 min-w-[200px]">{ledger.address}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{ledger.previous_location}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{ledger.next_location}</td>
                    <td className="px-4 py-3 font-medium">{ledger.reservations?.guest_count || '-'} 名</td>
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
