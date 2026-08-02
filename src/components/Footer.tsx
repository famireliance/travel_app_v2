import React from 'react';
import Link from 'next/link';
import { Compass, Ship, FileText, Mail, ShieldAlert } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 py-12 px-6 lg:px-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Brand */}
        <div className="md:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <Compass className="w-6 h-6 text-blue-400" />
            <span className="font-serif font-bold text-xl text-white tracking-widest">KIRATABI</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            日本全国432の有人離島・無人離島を巡る冒険トラッカー。あなたの人生に、一生モノの探求心を。
          </p>
        </div>

        {/* Links: Main */}
        <div>
          <h4 className="font-bold text-sm text-white tracking-widest mb-4">コンテンツ</h4>
          <ul className="space-y-2 text-sm text-slate-400 font-medium">
            <li><Link href="/" className="hover:text-white transition-colors">トップページ</Link></li>
            <li><Link href="/map" className="hover:text-white transition-colors">全国離島マップ</Link></li>
            <li><Link href="/companion" className="hover:text-white transition-colors">精霊キャラクター図鑑</Link></li>
            <li><Link href="/mypage" className="hover:text-white transition-colors">マイページ (旅の記録)</Link></li>
            <li><Link href="/ranking" className="hover:text-white transition-colors">旅人ランキング</Link></li>
          </ul>
        </div>

        {/* Links: Integration */}
        <div>
          <h4 className="font-bold text-sm text-white tracking-widest mb-4">連携サービス</h4>
          <ul className="space-y-2 text-sm text-slate-400 font-medium">
            <li><a href="https://shima-senka.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1.5"><Ship size={14}/> 島専科</a></li>
            <li><a href="https://guide.kira-tabi.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1.5"><FileText size={14}/> KIRATABIガイド</a></li>
          </ul>
        </div>

        {/* Links: Support */}
        <div>
          <h4 className="font-bold text-sm text-white tracking-widest mb-4">サポート・規約</h4>
          <ul className="space-y-2 text-sm text-slate-400 font-medium">
            <li><a href="#" className="hover:text-white transition-colors flex items-center gap-1.5"><Mail size={14}/> お問い合わせ</a></li>
            <li><a href="#" className="hover:text-white transition-colors flex items-center gap-1.5"><ShieldAlert size={14}/> 利用規約・免責事項</a></li>
            <li><a href="#" className="hover:text-white transition-colors flex items-center gap-1.5"><ShieldAlert size={14}/> プライバシーポリシー</a></li>
          </ul>
        </div>

      </div>
      
      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-slate-800/50 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 font-medium">
        <p>&copy; {new Date().getFullYear()} KIRATABI - All rights reserved.</p>
        <p className="mt-2 md:mt-0">Powered by 島専科</p>
      </div>
    </footer>
  );
}
