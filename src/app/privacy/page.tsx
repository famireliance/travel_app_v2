import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'プライバシーポリシー',
  description: '輝旅 島専科（KIRATABI SHIMASENKA）における個人情報の取り扱い方針（プライバシーポリシー）です。',
  alternates: { canonical: 'https://island.kira-tabi.com/privacy' },
  openGraph: {
    title: 'プライバシーポリシー | 輝旅 島専科',
    description: '輝旅 島専科（KIRATABI SHIMASENKA）における個人情報の取り扱い方針です。',
    url: 'https://island.kira-tabi.com/privacy',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'プライバシーポリシー | 輝旅 島専科',
    description: '輝旅 島専科（KIRATABI SHIMASENKA）における個人情報の取り扱い方針です。',
    images: ['/og-image.png'],
  },
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
            KIRATABI運営事務局（以下、「当社」といいます。）は、離島旅記録・観光プラットフォーム「輝旅 島専科（キラ旅）」（以下、「本サービス」といいます。）におけるユーザーの個人情報の取扱いについて、個人情報の保護に関する法律（以下、「個人情報保護法」といいます。）を遵守し、以下のとおりプライバシーポリシー（以下、「本ポリシー」といいます。）を定めます。
          </p>

          <h3 className="text-lg font-bold text-slate-800 mt-8 mb-4">第1条（個人情報の定義）</h3>
          <p>
            本ポリシーにおいて「個人情報」とは、個人情報保護法にいう「個人情報」を指すものとし、生存する個人に関する情報であって、当該情報に含まれる氏名、生年月日、住所、電話番号、メールアドレス、旅券番号その他の記述等により特定の個人を識別できる情報、ならびに個人識別符号が含まれる情報を指します。
          </p>

          <h3 className="text-lg font-bold text-slate-800 mt-8 mb-4">第2条（取得する情報）</h3>
          <p>当社は、本サービスの各機能のご利用状況に応じて、以下の情報を適法かつ公正な手段により取得します。</p>
          <ul className="list-disc pl-6 space-y-2 mb-6">
            <li>
              <strong>アカウント情報：</strong>メールアドレス、ユーザー名（ニックネーム）、自己紹介文、認証識別子および暗号化された認証情報
            </li>
            <li>
              <strong>GPS・EXIF位置情報および到達履歴：</strong>GPSチェックイン機能を利用した際の現在地座標（緯度・経度）、写真チェックインまたは証明書作成時に選択された画像ファイルのEXIFメタデータ（撮影位置情報・撮影日時）、到達日時等の記録データ
            </li>
            <li>
              <strong>物理到達証明書の配送用情報：</strong>公式紙証明書の郵送オーダーまたはUltimate 1周年記念特典の申請時に入力された受取人氏名、郵便番号、住所、電話番号、印字用旅人ネーム
            </li>
            <li>
              <strong>宿泊・体験予約およびオンライン宿泊台帳（事前チェックイン）の記載事項：</strong>宿泊・体験予約リクエスト時および事前チェックイン機能利用時に入力された氏名、住所、連絡先電話番号、職業、宿泊日程・人数、ならびに日本国内に住所を有しない外国人宿泊者にあっては旅館業法に基づき記載が求められる国籍および旅券番号（パスポート番号）等
            </li>
            <li>
              <strong>投稿データおよび利用環境情報：</strong>島ノート（タイムライン）へ投稿された写真・テキスト、ご利用端末情報、OS・ブラウザ種別、IPアドレス、アクセスログ等
            </li>
          </ul>

          <h3 className="text-lg font-bold text-slate-800 mt-8 mb-4">第3条（クレジットカード決済情報の取扱い）</h3>
          <p>
            有料サブスクリプション（Premium / Ultimate）および物理到達証明書の決済処理には、国際的なセキュリティ基準（PCI DSS）に準拠した決済代行会社 <strong>Stripe, Inc.</strong> の決済システムを利用しています。ユーザーが入力したクレジットカード番号・有効期限・セキュリティコード等のカード情報はStripe社へ直接暗号化通信により送信・処理され、<strong>当社のサーバーではカード番号等を一切保持・保存いたしません</strong>（当社では決済状態および契約管理に必要なStripe顧客ID・サブスクリプションID・決済セッションIDのみを保持します）。
          </p>

          <h3 className="text-lg font-bold text-slate-800 mt-8 mb-4">第4条（個人情報の利用目的）</h3>
          <p>当社が個人情報を取得・利用する目的は以下のとおりです。</p>
          <ul className="list-disc pl-6 space-y-2 mb-6">
            <li>本サービスの提供・運営（離島到達認定、デジタル証明書発行、ランキング集計、アカウント管理等）のため</li>
            <li>有料サブスクリプションの契約管理、課金処理、およびサポート対応のため</li>
            <li>物理到達証明書の印刷・制作、シリアルナンバー管理、およびご指定住所への配送手配のため</li>
            <li>提携宿泊施設・体験事業者への予約リクエストの取次ぎ、および旅館業法に基づくオンライン宿泊台帳（事前チェックイン）情報の予約先施設への伝達のため</li>
            <li>ユーザーからのお問い合わせへの回答（本人確認を含む）および重要なお知らせの通知のため</li>
            <li>GPS偽装等の不正行為や利用規約違反行為の検知・防止、およびセキュリティ維持のため</li>
          </ul>

          <h3 className="text-lg font-bold text-slate-800 mt-8 mb-4">第5条（第三者提供および予約先宿泊施設への情報提供）</h3>
          <p className="mb-3">
            当社は、次に掲げる場合を除き、あらかじめユーザーの同意を得ることなく第三者に個人情報を提供することはありません。
          </p>
          <ul className="list-disc pl-6 space-y-2 mb-6">
            <li>
              <strong>宿泊・体験予約および事前チェックイン利用時における予約先施設への提供：</strong>ユーザーが本サービス上で特定の宿泊施設・体験事業者への予約リクエストまたはオンライン宿泊台帳（事前チェックイン）機能を利用した場合、予約手配・本人確認・旅館業法第6条に基づく宿泊者名簿の作成および現地での受入業務に必要な範囲で、当該予約先の宿泊施設・事業者に対して入力された個人情報（氏名・住所・電話番号・職業・国籍・旅券番号・宿泊日程等）を電磁的方法により提供します。提供を受けた各施設は、旅館業法その他の関連法令および自らの個人情報保護方針に従い当該情報を管理します。
            </li>
            <li>
              <strong>業務委託先への取扱いの委託：</strong>物理到達証明書の制作・発送業務における配送事業者（日本郵便・宅配事業者等）、クラウドインフラ提供事業者、および決済代行会社（Stripe, Inc.）に対し、利用目的の達成に必要な範囲内で個人情報の取扱いを委託する場合
            </li>
            <li>個人情報保護法その他の法令に基づき開示・提供が認められる場合（人の生命・身体・財産の保護、公衆衛生の向上、または国の機関もしくは地方公共団体等の法令上の事務への協力が必要な場合等）</li>
          </ul>

          <h3 className="text-lg font-bold text-slate-800 mt-8 mb-4">第6条（位置情報および公開投稿写真の注意点）</h3>
          <p>
            GPSチェックイン時およびEXIF判定時に取得した正確な緯度・経度座標そのものが他の一般ユーザーに公開されることはありません（公開プロフィールやランキング上では到達した「島名・到達島数」のみが表示されます）。一方、島ノート（タイムライン）へ公開された写真やコメントは他のユーザーから閲覧可能となるため、他者のプライバシーや個人を特定できる情報が写り込まないようご注意ください。
          </p>

          <h3 className="text-lg font-bold text-slate-800 mt-8 mb-4">第7条（安全管理措置および開示・削除等の請求）</h3>
          <p>
            当社は、取り扱う個人情報の漏えい、滅失または毀損の防止のため、SSL/TLS暗号化通信、アクセス制御（Row Level Security等）および権限管理等の適切な安全管理措置を講じます。ユーザーご本人から個人情報の開示、訂正、利用停止、またはアカウント退会に伴う削除のご請求があった場合は、ご本人確認のうえ法令に従い速やかに対応いたします。マイページの「設定」からもアカウント退会手続きが可能です。
          </p>

          <h3 className="text-lg font-bold text-slate-800 mt-8 mb-4">第8条（お問い合わせ窓口・ポリシーの変更）</h3>
          <p>
            本ポリシーおよび個人情報の取扱いに関するお問い合わせは、本サービス内のお問い合わせフォームまたは電子メール（<strong>support@kira-tabi.com</strong>）までご連絡ください。当社は、法令の改正やサービス内容の変更に応じて本ポリシーを改定することがあり、改定後の内容は本ページに掲載した時点から効力を生じるものとします。
          </p>

          <div className="mt-16 text-sm text-slate-400 space-y-1">
            <p>制定日：2026年8月1日</p>
            <p>最終改定日：2026年11月21日</p>
          </div>
        </div>
      </div>
    </div>
  );
}
