'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, Ship, FileText, Mail, ShieldAlert } from 'lucide-react';

export default function Footer() {
  const pathname = usePathname();
  if (pathname === '/map') return null;

  return (
    <footer className="bg-slate-900 text-slate-300 py-12 px-6 lg:px-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Brand */}
        <div className="md:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <Compass className="w-6 h-6 text-blue-400" />
            <span className="font-serif font-bold text-lg text-white tracking-widest leading-tight">輝旅 島専科<br/><span className="text-xs text-slate-400 font-sans tracking-normal">KIRATABI SHIMASENKA</span></span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed mb-4">
            日本全国の有人離島・無人離島を巡る冒険トラッカー。あなたの人生に、一生モノの探求心を。
          </p>
          <div className="flex flex-col items-start gap-1.5 mt-2">
            <span className="text-[0.6rem] font-bold text-amber-500 tracking-widest uppercase bg-black/20 px-1.5 py-0.5 rounded border border-amber-500/20">近日公開予定</span>
            <p className="text-[0.65rem] text-slate-400 leading-relaxed mt-1">iOS / Android 公式ネイティブアプリ<br/>現在開発中</p>
          </div>
        </div>

        {/* Links: Main */}
        <div>
          <h4 className="font-bold text-sm text-white tracking-widest mb-4">コンテンツ</h4>
          <ul className="space-y-2 text-sm text-slate-400 font-medium">
            <li><Link href="/" className="hover:text-white transition-colors">探す（ホーム）</Link></li>
            <li><Link href="/map" className="hover:text-white transition-colors">全国離島マップ</Link></li>
            <li><Link href="/globe" className="hover:text-white transition-colors">3D航空衛星地球儀</Link></li>
            <li><Link href="/route-planner" className="hover:text-white transition-colors">AIアイランドホッピング提案</Link></li>
            <li><Link href="/timeline" className="hover:text-white transition-colors">みんなの島ノート</Link></li>
            <li><Link href="/companion" className="hover:text-white transition-colors">精霊キャラクター図鑑</Link></li>
            <li><Link href="/mypage" className="hover:text-white transition-colors">マイページ・ログイン</Link></li>
          </ul>
        </div>

        {/* Links: Integration */}
        <div>
          <h4 className="font-bold text-sm text-white tracking-widest mb-4">連携サービス</h4>
          <ul className="space-y-2 text-sm text-slate-400 font-medium">
            <li><a href="https://kira-tabi.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1.5"><Compass size={14}/> KIRATABI</a></li>
            <li><a href="https://guide.kira-tabi.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1.5"><FileText size={14}/> KIRATABIガイド</a></li>
            <li><a href="https://app.kira-tabi.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1.5"><Ship size={14}/> KIRATABI アプリ版</a></li>
          </ul>
        </div>

        {/* Links: Support */}
        <div>
          <h4 className="font-bold text-sm text-white tracking-widest mb-4">サポート・規約</h4>
          <ul className="space-y-2 text-sm text-slate-400 font-medium">
            <li><Link href="/contact" className="hover:text-white transition-colors flex items-center gap-1.5"><Mail size={14}/> お問い合わせ</Link></li>
            <li><Link href="/terms" className="hover:text-white transition-colors flex items-center gap-1.5"><ShieldAlert size={14}/> 利用規約・免責事項</Link></li>
            <li><Link href="/privacy" className="hover:text-white transition-colors flex items-center gap-1.5"><ShieldAlert size={14}/> プライバシーポリシー</Link></li>
            <li><Link href="/tokushoho" className="hover:text-white transition-colors flex items-center gap-1.5"><ShieldAlert size={14}/> 特定商取引法に基づく表記</Link></li>
          </ul>
        </div>

      </div>
      
      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-slate-800/50 flex flex-col md:flex-row items-center justify-center text-xs text-slate-500 font-medium">
        <p>&copy; {new Date().getFullYear()} 輝旅 島専科（KIRATABI SHIMASENKA）- All rights reserved.</p>
      </div>
    </footer>
  );
}
