import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'プライバシーポリシー | キラ旅',
  description: 'キラ旅における個人情報の取り扱い方針です。',
};

export default function PrivacyPage() {
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
        <h1 className="font-serif text-3xl font-bold text-slate-800 mb-8 tracking-widest border-b border-slate-200 pb-4">プライバシーポリシー</h1>
        
        <div className="prose prose-slate prose-sm sm:prose-base max-w-none text-slate-600">
          <p className="mb-8">
            キラ旅（以下、「本サービス」といいます。）は、ユーザーの皆様の個人情報の取扱いについて、以下のとおりプライバシーポリシー（以下、「本ポリシー」といいます。）を定めます。
          </p>

          <h3 className="text-lg font-bold text-slate-800 mt-8 mb-4">第1条（個人情報の定義）</h3>
          <p>
            「個人情報」とは、個人情報保護法にいう「個人情報」を指すものとし、生存する個人に関する情報であって、当該情報に含まれる氏名、生年月日、住所、電話番号、連絡先その他の記述等により特定の個人を識別できる情報、及び容貌、指紋、声紋にかかるデータ、及び健康保険証の保険者番号などの当該情報単体から特定の個人を識別できる情報（個人識別符号）を指します。
          </p>

          <h3 className="text-lg font-bold text-slate-800 mt-8 mb-4">第2条（収集する情報）</h3>
          <p>本サービスでは、以下の情報を収集する場合があります。</p>
          <ul className="list-disc pl-6 space-y-2 mb-6">
            <li><strong>アカウント情報：</strong>メールアドレス、ユーザー名（ニックネーム）、パスワードなど</li>
            <li><strong>位置情報・行動履歴：</strong>GPSチェックイン機能を利用した際の現在地（緯度経度）、到達日時、経路等の履歴データ</li>
            <li><strong>端末情報：</strong>ご利用のデバイス、OSバージョン、ブラウザ種別などの利用環境に関する情報</li>
            <li><strong>投稿データ：</strong>島ノート機能やチェックイン時にアップロードされた写真、テキストデータ</li>
          </ul>

          <h3 className="text-lg font-bold text-slate-800 mt-8 mb-4">第3条（個人情報を収集・利用する目的）</h3>
          <p>本サービスが個人情報を収集・利用する目的は、以下のとおりです。</p>
          <ul className="list-disc pl-6 space-y-2 mb-6">
            <li>本サービスの提供・運営のため（到達認定、ランキングの集計・表示等）</li>
            <li>ユーザーからのお問い合わせに回答するため（本人確認を行うことを含む）</li>
            <li>ユーザーが利用中のサービスの更新情報、キャンペーン等及び本サービスが提供する他のサービスの案内のメールを送付するため</li>
            <li>メンテナンス、重要なお知らせなど必要に応じたご連絡のため</li>
            <li>利用規約に違反したユーザーや、不正・不当な目的でサービスを利用しようとするユーザーの特定をし、ご利用をお断りするため</li>
            <li>ユーザーにご自身の登録情報の閲覧や変更、削除、ご利用状況の閲覧を行っていただくため</li>
          </ul>

          <h3 className="text-lg font-bold text-slate-800 mt-8 mb-4">第4条（位置情報及び写真の取り扱いについて）</h3>
          <p>
            本サービスの中核となるGPSチェックイン機能は、ユーザーのデバイスから送信される位置情報を元に判定を行います。
            ユーザーがチェックインを行った際の正確な位置データは、到達認定と到達履歴の保存のためサーバーに送信・記録されます。
            <br />
            また、島ノート（タイムライン）等へアップロードされた写真は、他のユーザーに公開される場合があります。写真内に個人を特定できる情報や他者のプライバシーを侵害するものが含まれないよう、ユーザー自身の責任において投稿を行ってください。
          </p>

          <h3 className="text-lg font-bold text-slate-800 mt-8 mb-4">第5条（個人情報の第三者提供）</h3>
          <p>
            本サービスは、次に掲げる場合を除いて、あらかじめユーザーの同意を得ることなく、第三者に個人情報を提供することはありません。ただし、個人情報保護法その他の法令で認められる場合を除きます。
          </p>
          <ul className="list-disc pl-6 space-y-2 mb-6">
            <li>人の生命、身体または財産の保護のために必要がある場合であって、本人の同意を得ることが困難であるとき</li>
            <li>公衆衛生の向上または児童の健全な育成の推進のために特に必要がある場合であって、本人の同意を得ることが困難であるとき</li>
            <li>国の機関もしくは地方公共団体またはその委託を受けた者が法令の定める事務を遂行することに対して協力する必要がある場合であって、本人の同意を得ることにより当該事務の遂行に支障を及ぼすおそれがあるとき</li>
          </ul>

          <h3 className="text-lg font-bold text-slate-800 mt-8 mb-4">第6条（プライバシーポリシーの変更）</h3>
          <p>
            本ポリシーの内容は、法令その他本ポリシーに別段の定めのある事項を除いて、ユーザーに通知することなく、変更することができるものとします。
            変更後のプライバシーポリシーは、本ウェブサイトに掲載したときから効力を生じるものとします。
          </p>

          <div className="mt-16 text-sm text-slate-400">
            <p>制定日：2026年8月1日</p>
          </div>
        </div>
      </div>
    </div>
  );
}
