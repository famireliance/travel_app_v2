import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '特定商取引法に基づく表記',
  description: '輝旅 島専科（KIRATABI SHIMASENKA）の特定商取引法に基づく表記についてのご案内です。',
  alternates: { canonical: 'https://island.kira-tabi.com/tokushoho' },
  openGraph: {
    title: '特定商取引法に基づく表記 | 輝旅 島専科',
    description: '輝旅 島専科（KIRATABI SHIMASENKA）の特定商取引法に基づく表記についてのご案内です。',
    url: 'https://island.kira-tabi.com/tokushoho',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '特定商取引法に基づく表記 | 輝旅 島専科',
    description: '輝旅 島専科（KIRATABI SHIMASENKA）の特定商取引法に基づく表記についてのご案内です。',
    images: ['/og-image.png'],
  },
};

export default function TokushohoPage() {
  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
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

      <main className="max-w-3xl mx-auto px-6 pt-12">
        <h1 className="font-serif text-3xl font-bold text-slate-900 mb-10 text-center tracking-widest">
          特定商取引法に基づく表記
        </h1>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="divide-y divide-slate-200 text-sm sm:text-base">
            <div className="flex flex-col md:flex-row p-6">
              <div className="md:w-1/3 font-bold text-slate-900 mb-2 md:mb-0">事業者の名称</div>
              <div className="md:w-2/3 text-slate-600">
                KIRATABI運営事務局（輝旅 島専科）
              </div>
            </div>

            <div className="flex flex-col md:flex-row p-6">
              <div className="md:w-1/3 font-bold text-slate-900 mb-2 md:mb-0">代表者または通信販売に関する業務の責任者の氏名</div>
              <div className="md:w-2/3 text-slate-600">
                KIRATABI運営責任者（請求があった場合に遅滞なく開示いたします）
              </div>
            </div>

            <div className="flex flex-col md:flex-row p-6">
              <div className="md:w-1/3 font-bold text-slate-900 mb-2 md:mb-0">住所</div>
              <div className="md:w-2/3 text-slate-600">
                請求があった場合に遅滞なく開示いたします
              </div>
            </div>

            <div className="flex flex-col md:flex-row p-6">
              <div className="md:w-1/3 font-bold text-slate-900 mb-2 md:mb-0">電話番号</div>
              <div className="md:w-2/3 text-slate-600">
                請求があった場合に遅滞なく開示いたします<br />
                <span className="text-xs sm:text-sm text-slate-500">
                  ※サービスに関するお問い合わせ・開示請求は、お問い合わせフォームまたは電子メール（support@kira-tabi.com）より受け付けております。
                </span>
              </div>
            </div>

            <div className="flex flex-col md:flex-row p-6">
              <div className="md:w-1/3 font-bold text-slate-900 mb-2 md:mb-0">メールアドレス</div>
              <div className="md:w-2/3 text-slate-600">
                support@kira-tabi.com
              </div>
            </div>

            <div className="flex flex-col md:flex-row p-6">
              <div className="md:w-1/3 font-bold text-slate-900 mb-2 md:mb-0">商品の販売価格・サービスの対価</div>
              <div className="md:w-2/3 text-slate-600 space-y-3">
                <div>
                  <p className="font-bold text-slate-800 mb-1">1. 有料サブスクリプション（定期課金）</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>KIRATABI Premium：</strong>月額480円（税込）</li>
                    <li><strong>KIRATABI Ultimate：</strong>月額980円（税込）</li>
                  </ul>
                  <p className="text-xs text-slate-500 mt-1">※基本機能（Freeプラン）は0円（無料）でご利用いただけます。</p>
                </div>
                <div>
                  <p className="font-bold text-slate-800 mb-1">2. 公式物理到達証明書（郵送オーダー・都度課金）</p>
                  <p className="mb-1">1,500円〜10,000円（税込）、ラミネート加工オプション+300円（税込）、日本国内送料無料</p>
                  <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-slate-500">
                    <li>スタンダード版（特製台紙付き）：1,500円（税込）</li>
                    <li>簡易フレーム装飾版：3,000円（税込）</li>
                    <li>高級木製フレーム版：6,000円（税込）</li>
                    <li>アクリル額装プレミアム版：10,000円（税込）</li>
                    <li>ラミネート加工オプション：+300円（税込）</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row p-6">
              <div className="md:w-1/3 font-bold text-slate-900 mb-2 md:mb-0">対価以外に必要となる費用</div>
              <div className="md:w-2/3 text-slate-600 space-y-1">
                <p>・物理到達証明書の配送料：日本国内送料無料（現在、海外への発送は承っておりません）</p>
                <p>・インターネット接続料金その他の電気通信回線の通信に関する費用はお客様にて別途ご負担いただきます。</p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row p-6">
              <div className="md:w-1/3 font-bold text-slate-900 mb-2 md:mb-0">支払方法</div>
              <div className="md:w-2/3 text-slate-600">
                クレジットカード決済（決済代行会社 Stripe, Inc. を通じた決済）
              </div>
            </div>

            <div className="flex flex-col md:flex-row p-6">
              <div className="md:w-1/3 font-bold text-slate-900 mb-2 md:mb-0">代金の支払時期</div>
              <div className="md:w-2/3 text-slate-600">
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>都度課金（物理到達証明書）：</strong>注文・決済手続き完了時</li>
                  <li><strong>定期課金（サブスクリプション）：</strong>初回登録時、以降は毎月自動更新時（上位プランへの変更時は残り期間に応じた日割り差額が次回請求時に合算されます）</li>
                </ul>
              </div>
            </div>

            <div className="flex flex-col md:flex-row p-6">
              <div className="md:w-1/3 font-bold text-slate-900 mb-2 md:mb-0">商品引渡しまたはサービス提供の時期</div>
              <div className="md:w-2/3 text-slate-600">
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>デジタル機能・有料サブスクリプション特典：</strong>決済手続き完了後、直ちにご利用いただけます。</li>
                  <li><strong>郵送紙証明書（実物到達証明書）：</strong>決済完了後、通常3〜7営業日以内に発送いたします（離島・遠隔地への配送や天候状況により、お届けにお時間をいただく場合がございます）。</li>
                </ul>
              </div>
            </div>

            <div className="flex flex-col md:flex-row p-6">
              <div className="md:w-1/3 font-bold text-slate-900 mb-2 md:mb-0">返品・交換・解約に関する特約</div>
              <div className="md:w-2/3 text-slate-600 space-y-3">
                <div>
                  <p className="font-bold text-slate-800 mb-1">1. デジタルコンテンツおよび物理到達証明書の返品・交換</p>
                  <p>
                    デジタル機能の性質上、ならびに物理到達証明書がお客様の旅人ネーム・到達日・固有シリアルナンバー等を個別に印字する受注生産品である性質上、決済完了後のお客様都合による返品・交換・キャンセルはお受けできません。ただし、配送中の破損や印字不良等の初期不良がある場合は、商品到着後7日以内にサポート窓口（support@kira-tabi.com）までご連絡いただければ、当社送料負担にて無償で良品との交換または返金いたします。
                  </p>
                </div>
                <div>
                  <p className="font-bold text-slate-800 mb-1">2. 定期課金（サブスクリプション）の解約条件</p>
                  <p>
                    マイページ内のカスタマーポータル（「お支払い管理・解約」）より、いつでも次回更新日前の解約（自動更新の停止）手続きが可能です。解約手続きが完了した場合、次回更新日以降の課金は発生せず、現在の契約期間の有効期限満了日までは引き続き有料機能をご利用いただけます。契約期間途中の解約による日割り返金は行っておりません。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
