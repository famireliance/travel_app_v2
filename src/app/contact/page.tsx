import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, Mail, MessageSquare } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'お問い合わせ | キラ旅',
  description: 'キラ旅に関するお問い合わせはこちらから。',
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* Simple Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors">
            <ArrowLeft size={20} />
            <span className="text-sm font-bold tracking-widest">ホームに戻る</span>
          </Link>
          <div className="flex items-center gap-2 text-blue-600">
            <Shield size={20} />
            <span className="font-serif font-bold tracking-widest">KIRATABI</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 pt-12">
        <div className="text-center mb-12">
          <h1 className="font-serif text-3xl font-bold text-slate-800 mb-4 tracking-widest">お問い合わせ</h1>
          <p className="text-slate-500">
            アプリのご利用に関する質問や、不具合のご報告、<br className="hidden sm:block"/>
            その他ご要望などがございましたら、お気軽にお問い合わせください。
          </p>
        </div>
        
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 mb-8">
          <div className="flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-2">
              <Mail size={32} strokeWidth={1.5} />
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">メールでのサポート</h3>
              <p className="text-sm text-slate-500 mb-4">
                以下のメールアドレス宛にお問い合わせ内容をお送りください。<br/>
                内容を確認次第、担当者より順次ご返信させていただきます。
              </p>
              <a 
                href="mailto:support@kira-tabi.com" 
                className="inline-flex items-center gap-2 text-lg font-mono font-bold text-blue-600 hover:text-blue-700 transition-colors bg-blue-50 px-6 py-3 rounded-xl"
              >
                support@kira-tabi.com
              </a>
            </div>
            
            <div className="w-full h-px bg-slate-100 my-4" />
            
            <div className="w-full text-left text-sm text-slate-500">
              <h4 className="font-bold text-slate-700 flex items-center gap-2 mb-3">
                <MessageSquare size={16} /> お問い合わせの際のお願い
              </h4>
              <ul className="list-disc pl-5 space-y-2">
                <li>不具合に関するお問い合わせの場合、ご利用の端末（iPhone 15, Android等）やOSのバージョン、発生した画面の詳細を記載していただけると調査がスムーズです。</li>
                <li>チェックイン関連（位置情報エラーなど）の場合は、発生時刻と滞在していた島名をお知らせください。</li>
                <li>原則として3営業日以内にご返答いたしますが、混雑状況によりお時間をいただく場合がございます。</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="text-center text-xs text-slate-400">
          <p>※こちらは現在モックアップとして表示しています。</p>
        </div>
      </div>
    </div>
  );
}
