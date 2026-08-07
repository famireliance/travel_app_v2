import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '利用規約 | キラ旅',
  description: 'キラ旅の利用規約についてのご案内です。',
};

export default function TermsPage() {
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
      <div className="max-w-3xl mx-auto px-6 pt-12">
        <h1 className="font-serif text-3xl font-bold text-slate-800 mb-8 tracking-widest border-b border-slate-200 pb-4">利用規約</h1>
        
        <div className="prose prose-slate prose-sm sm:prose-base max-w-none text-slate-600">
          <p className="mb-8">
            この利用規約（以下、「本規約」といいます。）は、キラ旅（以下、「本サービス」といいます。）の利用条件を定めるものです。登録ユーザーの皆様（以下、「ユーザー」といいます。）には、本規約に従って本サービスをご利用いただきます。
          </p>

          <h3 className="text-lg font-bold text-slate-800 mt-8 mb-4">第1条（適用）</h3>
          <p>
            本規約は、ユーザーと本サービスとの間の本サービスの利用に関わる一切の関係に適用されるものとします。
          </p>

          <h3 className="text-lg font-bold text-slate-800 mt-8 mb-4">第2条（ユーザー登録）</h3>
          <ul className="list-disc pl-6 space-y-2 mb-6">
            <li>登録希望者が本サービスの定める方法によって利用登録を申請し、本サービスがこれを承認することによって、利用登録が完了するものとします。</li>
            <li>本サービスは、利用登録の申請者に以下の事由があると判断した場合、利用登録の申請を承認しないことがあり、その理由については一切の開示義務を負わないものとします。
              <ul className="list-circle pl-6 mt-2 space-y-1">
                <li>利用登録の申請に際して虚偽の事項を届け出た場合</li>
                <li>本規約に違反したことがある者からの申請である場合</li>
                <li>その他、本サービスが利用登録を相当でないと判断した場合</li>
              </ul>
            </li>
          </ul>

          <h3 className="text-lg font-bold text-slate-800 mt-8 mb-4">第3条（禁止事項）</h3>
          <p>ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。</p>
          <ul className="list-disc pl-6 space-y-2 mb-6">
            <li>法令または公序良俗に違反する行為</li>
            <li>犯罪行為に関連する行為</li>
            <li>本サービス、本サービスの他のユーザー、または第三者のサーバーまたはネットワークの機能を破壊したり、妨害したりする行為</li>
            <li>本サービスの運営を妨害するおそれのある行為</li>
            <li>他のユーザーに関する個人情報等を収集または蓄積する行為</li>
            <li>不正アクセスをし、またはこれを試みる行為</li>
            <li>GPSの偽装、チートツールの使用等により不正に位置情報やチェックイン記録を改ざんする行為</li>
            <li>他のユーザーに成りすます行為</li>
          </ul>

          <h3 className="text-lg font-bold text-slate-800 mt-8 mb-4">第4条（本サービスの提供の停止等）</h3>
          <p>本サービスは、以下のいずれかの事由があると判断した場合、ユーザーに事前に通知することなく本サービスの全部または一部の提供を停止または中断することができるものとします。</p>
          <ul className="list-disc pl-6 space-y-2 mb-6">
            <li>本サービスにかかるコンピュータシステムの保守点検または更新を行う場合</li>
            <li>地震、落雷、火災、停電または天災などの不可抗力により、本サービスの提供が困難となった場合</li>
            <li>コンピュータまたは通信回線等が事故により停止した場合</li>
            <li>その他、本サービスが本サービスの提供が困難と判断した場合</li>
          </ul>

          <h3 className="text-lg font-bold text-slate-800 mt-8 mb-4">第5条（免責事項）</h3>
          <p>
            本サービスは、本サービスに事実上または法律上の瑕疵（安全性、信頼性、正確性、完全性、有効性、特定の目的への適合性、セキュリティなどに関する欠陥、エラーやバグ、権利侵害などを含みます。）がないことを明示的にも黙示的にも保証しておりません。
            また、ユーザーが本サービスに登録・投稿したデータ（位置情報、写真、メモなど）について、本サービスはその保存義務を負わず、消失した場合でも一切の責任を負いません。
          </p>

          <h3 className="text-lg font-bold text-slate-800 mt-8 mb-4">第6条（サービス内容の変更等）</h3>
          <p>
            本サービスは、ユーザーに通知することなく、本サービスの内容を変更しまたは本サービスの提供を中止することができるものとし、これによってユーザーに生じた損害について一切の責任を負いません。
          </p>

          <h3 className="text-lg font-bold text-slate-800 mt-8 mb-4">第7条（利用規約の変更）</h3>
          <p>
            本サービスは、必要と判断した場合には、ユーザーに通知することなくいつでも本規約を変更することができるものとします。なお、本規約の変更後、本サービスの利用を開始した場合には、当該ユーザーは変更後の規約に同意したものとみなします。
          </p>

          <div className="mt-16 text-sm text-slate-400">
            <p>制定日：2026年8月1日</p>
            <p>※本ページの内容は雛形であり、正式な運営に伴い更新される場合があります。</p>
          </div>
        </div>
      </div>
    </div>
  );
}
