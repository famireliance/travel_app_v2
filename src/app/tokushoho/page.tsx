import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '特定商取引法に基づく表記',
  description: 'KIRATABIの特定商取引法に基づく表記について',
};

export default function TokushohoPage() {
  return (
    <main className="min-h-screen bg-slate-50 pt-32 pb-24">
      <div className="max-w-3xl mx-auto px-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-12 text-center">特定商取引法に基づく表記</h1>
        
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="divide-y divide-slate-200">
            
            <div className="flex flex-col md:flex-row p-6">
              <div className="md:w-1/3 font-bold text-slate-900 mb-2 md:mb-0">事業者の名称</div>
              <div className="md:w-2/3 text-slate-600">
                KIRATABI運営事務局
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
                <span className="text-sm text-slate-500">※サービスに関するお問い合わせ・開示請求は、お問い合わせフォームまたは電子メール（support@kira-tabi.com）より受け付けております。</span>
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
              <div className="md:w-2/3 text-slate-600">
                各購入ページまたはサブスクリプション登録ページにて表示する価格
              </div>
            </div>

            <div className="flex flex-col md:flex-row p-6">
              <div className="md:w-1/3 font-bold text-slate-900 mb-2 md:mb-0">対価以外に必要となる費用</div>
              <div className="md:w-2/3 text-slate-600">
                インターネット接続料金その他の電気通信回線の通信に関する費用はお客様にて別途ご用意いただく必要があります。
              </div>
            </div>

            <div className="flex flex-col md:flex-row p-6">
              <div className="md:w-1/3 font-bold text-slate-900 mb-2 md:mb-0">支払方法</div>
              <div className="md:w-2/3 text-slate-600">
                クレジットカード決済（Stripeを通じた決済）
              </div>
            </div>

            <div className="flex flex-col md:flex-row p-6">
              <div className="md:w-1/3 font-bold text-slate-900 mb-2 md:mb-0">代金の支払時期</div>
              <div className="md:w-2/3 text-slate-600">
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>都度課金：</strong>購入手続き完了時</li>
                  <li><strong>定期課金（サブスクリプション）：</strong>初回登録時、以降は毎月自動更新時</li>
                </ul>
              </div>
            </div>

            <div className="flex flex-col md:flex-row p-6">
              <div className="md:w-1/3 font-bold text-slate-900 mb-2 md:mb-0">商品引渡しまたはサービス提供の時期</div>
              <div className="md:w-2/3 text-slate-600">
                購入に関する決済手続き完了後、直ちにご利用いただけます。
              </div>
            </div>

            <div className="flex flex-col md:flex-row p-6">
              <div className="md:w-1/3 font-bold text-slate-900 mb-2 md:mb-0">返品・キャンセルに関する特約</div>
              <div className="md:w-2/3 text-slate-600">
                <p className="mb-2">デジタルコンテンツの性質上、購入後のキャンセルや返金は原則としてお受けできません。</p>
                <p><strong>定期課金（サブスクリプション）の解約について：</strong><br />
                マイページの「サブスクリプション管理」よりいつでも解約手続きが可能です。解約手続きが完了した場合、次回の更新日から課金が停止され、現在の有効期限までは引き続きサービスをご利用いただけます。日割りでの返金は行っておりません。</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}
