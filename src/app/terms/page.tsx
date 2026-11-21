import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '利用規約',
  description: '輝旅 島専科（KIRATABI SHIMASENKA）の利用規約についてのご案内です。',
  alternates: { canonical: 'https://island.kira-tabi.com/terms' },
  openGraph: {
    title: '利用規約 | 輝旅 島専科',
    description: '輝旅 島専科（KIRATABI SHIMASENKA）の利用規約についてのご案内です。',
    url: 'https://island.kira-tabi.com/terms',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '利用規約 | 輝旅 島専科',
    description: '輝旅 島専科（KIRATABI SHIMASENKA）の利用規約についてのご案内です。',
    images: ['/og-image.png'],
  },
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
            この利用規約（以下、「本規約」といいます。）は、KIRATABI運営事務局（以下、「当社」といいます。）が運営する離島旅記録・観光プラットフォーム「輝旅 島専科（キラ旅）」（以下、「本サービス」といいます。）の利用条件を定めるものです。本サービスをご利用になる皆様（以下、「ユーザー」といいます。）には、本規約に同意のうえ本サービスをご利用いただきます。
          </p>

          <h3 className="text-lg font-bold text-slate-800 mt-8 mb-4">第1条（適用）</h3>
          <p>
            本規約は、ユーザーと当社との間の本サービスの利用に関わる一切の関係に適用されるものとします。当社が本サービス上で掲載する個別規定やガイドライン、特定商取引法に基づく表記等は、本規約の一部を構成するものとします。
          </p>

          <h3 className="text-lg font-bold text-slate-800 mt-8 mb-4">第2条（ユーザー登録およびアカウント管理）</h3>
          <ul className="list-disc pl-6 space-y-2 mb-6">
            <li>登録希望者が当社の定める方法によって利用登録を申請し、当社がこれを承認することによって、利用登録が完了するものとします。</li>
            <li>ユーザーは、自己の責任においてアカウント情報（メールアドレス・パスワード等）を適切に管理するものとし、第三者に譲渡・貸与・共用してはなりません。</li>
            <li>当社は、利用登録の申請者に以下の事由があると判断した場合、利用登録の申請を承認しないことがあり、その理由については開示義務を負わないものとします。
              <ul className="list-circle pl-6 mt-2 space-y-1">
                <li>利用登録の申請に際して虚偽の事項を届け出た場合</li>
                <li>過去に本規約に違反したことがある者からの申請である場合</li>
                <li>その他、当社が利用登録を相当でないと判断した場合</li>
              </ul>
            </li>
          </ul>

          <h3 className="text-lg font-bold text-slate-800 mt-8 mb-4">第3条（有料サブスクリプションの課金・更新・解約）</h3>
          <ul className="list-disc pl-6 space-y-2 mb-6">
            <li>ユーザーは、無料プラン（Free）のほか、当社の定める手続きおよびクレジットカード決済（Stripe決済）により、有料サブスクリプションプランである「KIRATABI Premium（月額480円・税込）」または「KIRATABI Ultimate（月額980円・税込）」に申し込むことができます。</li>
            <li>各プランにおける公式高画質デジタル証明書のクラウド保存枠（Free：月1枚まで、Premium：月5枚まで、Ultimate：無制限）、広告スキップ、相棒精霊の最終進化（第4形態）解放、ならびにUltimateプランの1年継続記念特典（年1回・対象期間内の申請による公式紙証明書1通の無料贈呈）等の提供内容は、本サービス上のプラン表に定めるとおりとします。</li>
            <li>有料サブスクリプションの利用料金は初回登録時に課金され、以降は契約日から1ヶ月ごとに自動的に契約が更新され月額料金が課金されます。契約期間途中にプランを変更した場合、残り日数に応じた日割り差額が次回請求時に精算されます。</li>
            <li>有料サブスクリプションの解約（自動更新の停止）は、マイページ内のカスタマーポータル（「お支払い管理・解約」）より、次回更新日前であればいつでも手続きを行うことができます。解約手続き完了後も現在の有効期限満了日までは有料機能をご利用いただけますが、契約期間途中の解約による日割り返金は行いません。</li>
          </ul>

          <h3 className="text-lg font-bold text-slate-800 mt-8 mb-4">第4条（物理到達証明書の注文・制作・発送）</h3>
          <ul className="list-disc pl-6 space-y-2 mb-6">
            <li>ユーザーは、本サービス上で公式物理到達証明書（台紙付き・各種フレーム額装版：1,500円〜10,000円［税込］、ラミネート加工オプション：+300円［税込］）を都度購入にて注文することができます。配送先は日本国内に限り、国内送料は無料とします。</li>
            <li>当社は、決済完了後、通常3〜7営業日以内にご指定の日本国内住所へ商品を発送いたします。ただし、離島・遠隔地への配送や天候・交通事情等により、到着までにお時間を要する場合があります。</li>
            <li>物理到達証明書は、ユーザーが指定した旅人ネーム・到達日・写真・固有シリアルナンバー等を個別に印字して制作する受注生産品（オーダーメイド商品）であるため、決済完了後のユーザー都合によるキャンセル、内容変更、返品または交換はお受けできません。</li>
            <li>万一、配送中の破損、汚損、または当社の責に帰すべき印字不良・品違いがあった場合には、商品到着後7日以内に当社サポート窓口（support@kira-tabi.com）までご連絡いただくことで、当社送料負担にて無償で良品との交換または返金対応を行います。</li>
          </ul>

          <h3 className="text-lg font-bold text-slate-800 mt-8 mb-4">第5条（宿泊施設・体験予約リクエスト機能における当社の立場）</h3>
          <ul className="list-disc pl-6 space-y-2 mb-6">
            <li>本サービスにおける宿泊施設、レンタカー、マリンアクティビティ等の紹介、予約リクエスト送信機能、およびオンライン宿泊台帳（事前チェックイン）機能は、ユーザーと各宿泊施設・体験提供事業者（以下、「提携施設等」といいます。）との間の連絡・情報伝達を支援する情報掲載および取次プラットフォームとして提供されるものです。</li>
            <li>当社は旅行業法上の旅行業者ではなく、宿泊契約、レンタカー貸渡契約、体験利用契約その他の役務提供契約（以下、「宿泊契約等」といいます。）の当事者とはなりません。宿泊契約等は、ユーザーと各提携施設等との間で直接成立するものとします。</li>
            <li>宿泊料金等の支払い条件、キャンセル料、予約変更、現地での役務提供内容、ならびに提携施設等の責に帰すべき事由によるトラブルについては、各提携施設等が定める宿泊約款・利用規約等が適用され、当事者間で解決するものとします。</li>
          </ul>

          <h3 className="text-lg font-bold text-slate-800 mt-8 mb-4">第6条（禁止事項）</h3>
          <p>ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。</p>
          <ul className="list-disc pl-6 space-y-2 mb-6">
            <li>法令または公序良俗に違反する行為、または犯罪行為に関連する行為</li>
            <li>GPS位置情報の偽装、EXIFデータの改ざん、自動化ツール等の使用により不正にチェックイン記録・到達証明・ポイント等を取得する行為</li>
            <li>虚偽の予約リクエストの送信、無断キャンセル（ノーショー）、または提携施設等の業務を妨害する行為</li>
            <li>当社、他のユーザー、提携施設等または第三者の知的財産権、肖像権、プライバシー、名誉その他の権利または利益を侵害する行為</li>
            <li>本サービスのサーバーまたはネットワークの機能を破壊したり、過度な負荷をかけたり、運営を妨害する行為</li>
            <li>不正アクセスをし、またはこれを試みる行為、ならびに他のユーザーに成りすます行為</li>
          </ul>

          <h3 className="text-lg font-bold text-slate-800 mt-8 mb-4">第7条（本サービスの提供の停止・変更等）</h3>
          <p className="mb-3">
            当社は、以下のいずれかの事由があると判断した場合、ユーザーに事前に通知することなく本サービスの全部または一部の提供を停止または中断することができるものとします。
          </p>
          <ul className="list-disc pl-6 space-y-2 mb-6">
            <li>本サービスにかかるコンピュータシステムの保守点検または更新を行う場合</li>
            <li>地震、落雷、台風、火災、停電または天災などの不可抗力により、本サービスの提供が困難となった場合</li>
            <li>コンピュータ、通信回線、外部クラウド基盤または決済基盤等が事故・障害により停止した場合</li>
            <li>その他、当社が本サービスの提供が困難と判断した場合</li>
          </ul>

          <h3 className="text-lg font-bold text-slate-800 mt-8 mb-4">第8条（免責および損害賠償の制限）</h3>
          <ul className="list-disc pl-6 space-y-2 mb-6">
            <li>当社は、本サービスに掲載される離島アクセス情報、気象・航路情報、AIによる推薦・ルート提案、施設情報等の正確性・最新性向上に努めますが、天候急変やダイヤ改正等が生じる離島の特性上、その完全性・確実性を保証するものではありません。実際の渡航にあたっては、必ず自治体・運航会社・各施設の公式最新情報をご確認ください。</li>
            <li>当社は、当社の故意または重過失による場合を除き、本サービスの利用または利用不能、データの消失、第三者との紛争等に関してユーザーに生じた損害について、次項に定める範囲を超えて責任を負わないものとします。</li>
            <li>本規約に基づくユーザーと当社との契約が消費者契約法に定める消費者契約に該当する場合において、当社の債務不履行または不法行為によりユーザーに損害が生じたときは、当社に故意または重過失がある場合を除き、当社はユーザーに現実に生じた直接かつ通常の損害に限り、損害発生月に当該ユーザーから当社が受領した有料サブスクリプション利用料金または当該物理証明書の購入代金の額（無料プランのみをご利用の場合は1,000円）を上限として損害賠償責任を負うものとします。</li>
          </ul>

          <h3 className="text-lg font-bold text-slate-800 mt-8 mb-4">第9条（利用規約の変更）</h3>
          <p>
            当社は、民法第548条の4の規定に基づき、ユーザーの一般の利益に適合する場合、または本規約の目的に反せず変更の必要性・変更後の内容の相当性が認められる場合には、変更後の本規約の効力発生時期および内容を本サービス上に周知することにより、本規約を変更することができるものとします。
          </p>

          <h3 className="text-lg font-bold text-slate-800 mt-8 mb-4">第10条（準拠法および合意管轄裁判所）</h3>
          <ul className="list-disc pl-6 space-y-2 mb-6">
            <li>本規約の解釈および適用にあたっては、日本法を準拠法とします。</li>
            <li>本サービスに関してユーザーと当社との間で紛争が生じた場合には、当社の主たる事務所の所在地を管轄する地方裁判所または簡易裁判所を第一審の専属的合意管轄裁判所とします。</li>
          </ul>

          <div className="mt-16 text-sm text-slate-400 space-y-1">
            <p>制定日：2026年8月1日</p>
            <p>最終改定日：2026年11月21日</p>
          </div>
        </div>
      </div>
    </div>
  );
}
