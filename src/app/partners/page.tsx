import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import {
  ArrowLeft,
  ArrowRight,
  Landmark,
  Store,
  BedDouble,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  BarChart3,
  Gift,
  Ship,
  Award,
  Crown,
  Mail,
} from 'lucide-react';

export const metadata: Metadata = {
  title: '自治体・観光協会（DMO）・島内事業者様向け公式タイアップ案内',
  description:
    '輝旅 島専科（KIRATABI SHIMASENKA）の離島自治体・観光協会（DMO）・航路事業者様向けデジタル来島証明＆周遊スタンプラリー、島内店舗向け5秒クーポンCM枠、宿泊施設向け直予約掲載のご案内です。',
  alternates: { canonical: 'https://island.kira-tabi.com/partners' },
  openGraph: {
    title: '自治体・観光協会・島内事業者様向けタイアップ案内 | 輝旅 島専科',
    description:
      'アプリ開発費ゼロで始めるデジタル来島証明・周遊スタンプラリー・島内店舗5秒クーポンCM・宿直予約掲載のご案内。',
    url: 'https://island.kira-tabi.com/partners',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '自治体・観光協会・島内事業者様向けタイアップ案内 | 輝旅 島専科',
    description:
      'アプリ開発費ゼロで始めるデジタル来島証明・周遊スタンプラリー・島内店舗5秒クーポンCM・宿直予約掲載のご案内。',
    images: ['/og-image.png'],
  },
};

export default function PartnersLandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-24">
      {/* Sticky Header */}
      <header className="bg-white/95 backdrop-blur border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-xs sm:text-sm font-bold tracking-wider">ホームに戻る</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline-block font-serif font-bold text-slate-900 tracking-widest text-sm">
              KIRATABI OFFICIAL PARTNER PROGRAM
            </span>
            <Link
              href="/contact"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold tracking-wider transition-colors shadow-sm"
            >
              資料請求・ご相談
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white py-16 sm:py-24 px-5 sm:px-8">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/15 border border-amber-400/40 text-amber-300 text-xs font-bold tracking-widest">
            <Sparkles className="w-4 h-4" />
            全国有人離島 対応プラットフォーム「輝旅 島専科」公式プログラム
          </div>
          <h1 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-wide">
            離島の「来島証明」と「島内回遊・消費」を、
            <br className="hidden sm:inline" />
            開発費ゼロで今すぐデジタル化。
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-3xl mx-auto leading-relaxed">
            「輝旅 島専科（KIRATABI）」は、日本全国の有人離島をめぐる島旅ファンが集う到達証明＆観光プラットフォームです。
            自治体・観光協会（DMO）・航路事業者様の周遊施策から、島内飲食店・ショップ・宿への直接送客まで、持続可能な離島観光を共に創ります。
          </p>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link
              href="/contact"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-extrabold text-sm tracking-wider shadow-xl flex items-center justify-center gap-2 transition-all"
            >
              <Mail className="w-4 h-4" />
              掲載・タイアップのお問い合わせ（無料相談）
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#programs"
              className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-sm tracking-wider transition-colors"
            >
              3つの連携プランを見る ↓
            </a>
          </div>
        </div>
      </section>

      {/* Quick Navigation Cards */}
      <section id="programs" className="max-w-6xl mx-auto px-5 sm:px-8 -mt-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <a
            href="#b2g-dmo"
            className="bg-white rounded-2xl p-6 shadow-md border border-slate-200 hover:border-emerald-500 transition-all group"
          >
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <Landmark className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-extrabold text-emerald-600 tracking-wider uppercase">
              PLAN 01 / B2G・DMO・航路
            </span>
            <h2 className="font-bold text-slate-900 text-base sm:text-lg mt-1 group-hover:text-emerald-700">
              自治体・観光協会・航路事業者様
            </h2>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              デジタル来島証明 × 周遊スタンプラリー × ご当地妖精タイアップパッケージ
            </p>
          </a>

          <a
            href="#local-cm"
            className="bg-white rounded-2xl p-6 shadow-md border border-slate-200 hover:border-amber-500 transition-all group"
          >
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
              <Store className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-extrabold text-amber-600 tracking-wider uppercase">
              PLAN 02 / 島内店舗PR・送客
            </span>
            <h2 className="font-bold text-slate-900 text-base sm:text-lg mt-1 group-hover:text-amber-700">
              島内飲食店・ショップ・体験事業者様
            </h2>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              到達証明書 5秒クーポンCM枠掲載（上陸中の旅行者100%へピンポイント訴求）
            </p>
          </a>

          <a
            href="#lodging-b2b"
            className="bg-white rounded-2xl p-6 shadow-md border border-slate-200 hover:border-blue-500 transition-all group"
          >
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <BedDouble className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-extrabold text-blue-600 tracking-wider uppercase">
              PLAN 03 / 宿泊施設DX
            </span>
            <h2 className="font-bold text-slate-900 text-base sm:text-lg mt-1 group-hover:text-blue-700">
              離島の宿・民宿・ホテル事業者様
            </h2>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              B2B直予約リクエスト掲載＆事前オンライン宿泊台帳で、島宿の運営負担を軽減
            </p>
          </a>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-5 sm:px-8 pt-16 space-y-20">
        {/* Section 1: B2G / DMO / Ferry Operators */}
        <section
          id="b2g-dmo"
          className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden"
        >
          <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-7 sm:p-10">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="px-3 py-1 rounded-full bg-emerald-400/20 border border-emerald-400/40 text-emerald-300 text-xs font-extrabold">
                離島自治体・観光協会（DMO）・フェリー航路事業者様向け
              </span>
              <span className="px-3 py-1 rounded-full bg-white/10 text-white text-xs font-bold">
                目安費用：年額 100,000円（税別）〜 応相談
              </span>
            </div>
            <h2 className="font-serif text-xl sm:text-3xl font-bold leading-snug">
              デジタル来島証明 × 周遊スタンプラリー × ご当地妖精タイアップパッケージ
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 mt-3 max-w-3xl leading-relaxed">
              単年度ごとに数百万円かけて専用スタンプラリーアプリを開発・廃棄する必要はありません。すでに全国の島旅愛好家が利用するKIRATABI基盤を活用し、低予算・最短スケジュールで公式デジタル来島証明と周遊企画を開始できます。
            </p>
          </div>

          <div className="p-7 sm:p-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-5">
              <h3 className="font-bold text-slate-900 text-base sm:text-lg flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-600" />
                パッケージに含まれる主な機能・支援内容
              </h3>
              <ul className="space-y-3.5 text-sm text-slate-700">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900">アプリ開発費ゼロで即導入可能：</strong>
                    ブラウザ完結（インストール不要）のため、港のポスターや船内QRコードからその場でチェックイン＆公認来島証を発行できます。
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900">GPS位置検証＆不正防止ロジック搭載：</strong>
                    現地ジオフェンス判定や写真EXIF検証に対応し、遠隔地からの不正取得を防止します。自治体公認印（角印・エンブレム）入り特別デザインにも対応可能です。
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <Gift className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900">観光案内所でのノベルティ引換・二次離島周遊連動：</strong>
                    「3島制覇で港の観光案内所にて限定ステッカー進呈」など、現地窓口や売店と連動した周遊キャンペーンを柔軟に設計できます。
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900">ご当地妖精（公認キャラクター）タイアップ：</strong>
                    島の特産品や伝承をモチーフにした「ご当地妖精」図鑑・育成機能と連携し、若年層・ファミリー層の再来島動機を創出します。
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <BarChart3 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900">来島データ・回遊動態の可視化レポート：</strong>
                    月別の来島チェックイン推移や併訪されやすい前後ルート等の統計データを、観光施策の基礎資料としてご活用いただけます。
                  </div>
                </li>
              </ul>
            </div>

            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-lg">
                  <Ship className="w-4 h-4" /> 導入モデルケース
                </div>
                <div className="space-y-3 text-xs sm:text-sm text-slate-600">
                  <div className="bg-white p-4 rounded-xl border border-slate-200">
                    <p className="font-bold text-slate-900 mb-1">
                      事例イメージ①：群島エリア周遊デジタルスタンプラリー
                    </p>
                    <p>
                      本島だけでなく周辺の二次離島への渡航を促進するため、対象5島のデジタル到達証明と公式台紙セット企画を実施。閑散期の航路乗船率向上に貢献。
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200">
                    <p className="font-bold text-slate-900 mb-1">
                      事例イメージ②：観光協会窓口での公認来島証＆地域クーポン配布
                    </p>
                    <p>
                      デジタル到達証明画面の提示で島内加盟店の優待を解放し、滞在中の飲食・お土産消費単価アップを実現。
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-slate-500 font-bold">自治体・DMO・航路事業者様 特別枠</p>
                  <p className="text-lg font-extrabold text-slate-900">
                    年額 10万円〜 <span className="text-xs font-normal text-slate-500">（人口規模・島数に応じ個別お見積り）</span>
                  </p>
                </div>
                <Link
                  href="/contact"
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs tracking-wider text-center transition-colors shadow"
                >
                  自治体・DMO窓口へ相談する →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Local Island Businesses 5-Second CM */}
        <section
          id="local-cm"
          className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden"
        >
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-amber-950 text-white p-7 sm:p-10">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-extrabold">
                島内店舗（飲食店・カフェ・お土産・マリン体験・レンタカー・宿）様向け
              </span>
              <span className="px-3 py-1 rounded-full bg-white/10 text-white text-xs font-bold">
                月額 3,000円（税別）〜 / GOLD優先枠あり
              </span>
            </div>
            <h2 className="font-serif text-xl sm:text-3xl font-bold leading-snug">
              到達証明書「5秒クーポンCM枠」スポンサー掲載
            </h2>
            <p className="text-xs sm:text-sm text-amber-100/90 mt-3 max-w-3xl leading-relaxed">
              「今まさにその島に上陸し、記念の到達証明書を発行した旅行者」100%へダイレクトに店舗写真と特典クーポンを表示！チラシ配布やSNS広告では届かない、島内滞在中の見込み客をそのままお店へ誘導します。
            </p>
          </div>

          <div className="p-7 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80">
                  <p className="font-extrabold text-slate-900 text-sm mb-1">
                    🎯 来島中の旅行者にピンポイント表示
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    対象の島で到達証明書を発行する5秒間の生成画面、および保存完了画面の直下に貴店の写真・特典・予約/地図リンクを自動表示します。
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80">
                  <p className="font-extrabold text-slate-900 text-sm mb-1">
                    🎁「証明書提示特典」で来店動機を創出
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    「到達証明書のご提示で1ドリンク無料」「お会計5%OFF」「レンタル優先案内」など、旅行者が思わず立ち寄りたくなる特典を設定できます。
                  </p>
                </div>
              </div>

              {/* Pricing Tiers */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50">
                  <span className="text-[10px] font-black px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                    STANDARD
                  </span>
                  <div className="text-xl font-extrabold text-slate-900 mt-2">
                    月額 3,000円<span className="text-xs font-normal text-slate-500">〜</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">
                    島内の通常ローテーション枠への掲載・特典リンク表示
                  </p>
                </div>
                <div className="p-4 rounded-2xl border border-slate-300 bg-white">
                  <span className="text-[10px] font-black px-2 py-0.5 rounded bg-slate-800 text-white">
                    SILVER
                  </span>
                  <div className="text-xl font-extrabold text-slate-900 mt-2">
                    月額 5,000円<span className="text-xs font-normal text-slate-500">〜</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">
                    STANDARD枠に優先して5秒CM＆特典カードを優先配信
                  </p>
                </div>
                <div className="p-4 rounded-2xl border-2 border-amber-400 bg-amber-50/40 relative">
                  <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-400 text-slate-950 inline-flex items-center gap-1">
                    <Crown className="w-3 h-3" /> GOLD 優先枠
                  </span>
                  <div className="text-xl font-extrabold text-slate-900 mt-2">
                    月額 10,000円<span className="text-xs font-normal text-slate-500">〜</span>
                  </div>
                  <p className="text-[11px] text-slate-700 mt-1.5 leading-relaxed font-medium">
                    対象島の最上位ランクとして最優先表示・GOLDバッジ付与
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-500">
                ※島の規模・年間来島者数・繁忙期のみの短期掲載（3ヶ月〜）にも柔軟に対応しております。まずはお気軽にお問い合わせください。
              </p>
            </div>

            {/* Visual Mockup of the 5s CM Card */}
            <div className="lg:col-span-5 bg-slate-950 rounded-3xl p-5 border border-slate-800 shadow-2xl text-center space-y-3">
              <div className="text-[11px] font-mono text-amber-300 bg-slate-900 px-3 py-1.5 rounded-lg border border-amber-500/30 inline-block">
                実際の表示イメージ（証明書発行時 5秒PR）
              </div>
              <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-5 border border-amber-500/40 space-y-3">
                <div className="flex items-center justify-center gap-1.5">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-bold">
                    島内公式パートナー PR
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black">
                    GOLD SPONSOR
                  </span>
                </div>
                <div>
                  <p className="text-white font-serif font-bold text-lg">島カフェ＆琉球ダイニング 海風</p>
                  <p className="text-sky-300 text-xs font-bold mt-0.5">飲食店・カフェ（港から徒歩3分）</p>
                </div>
                <div className="bg-amber-500/15 border border-amber-400/50 rounded-xl p-3 text-left">
                  <p className="text-xs font-extrabold text-amber-200 leading-relaxed">
                    🎁 到達証明書ご提示特典: お食事ご注文の方に島シークヮーサージュース1杯無料サービス！
                  </p>
                </div>
                <div className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-amber-400 text-slate-950 font-extrabold text-xs">
                  店舗・特典詳細を見る ↗
                </div>
              </div>
              <Link
                href="/contact"
                className="block w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs tracking-wider transition-colors"
              >
                5秒クーポンCM枠の空き状況を問い合わせる →
              </Link>
            </div>
          </div>
        </section>

        {/* Section 3: Lodging B2B Direct Booking */}
        <section
          id="lodging-b2b"
          className="bg-white rounded-3xl shadow-sm border border-slate-200 p-7 sm:p-10"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="space-y-4 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-extrabold">
                <BedDouble className="w-4 h-4" />
                宿泊施設向け B2B直予約・オンライン宿泊台帳掲載
              </div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-slate-900">
                電話対応の負担を減らし、離島旅に慣れた良質なゲストと直接つながる
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                大手予約サイト（OTA）に未掲載の島宿・民宿・ゲストハウス様でも、スマートフォンひとつで簡単に予約リクエストの承認・お断り管理が可能です。さらに「事前オンライン宿泊台帳」や欠航時の連絡サポート機能を備え、少人数で運営される離島の宿オーナー様を強力にバックアップします。
              </p>
              <div className="flex flex-wrap gap-2 pt-1 text-xs font-bold text-slate-700">
                <span className="px-3 py-1.5 rounded-lg bg-slate-100">✓ 初期登録サポート無料</span>
                <span className="px-3 py-1.5 rounded-lg bg-slate-100">✓ 宿オーナー専用管理画面</span>
                <span className="px-3 py-1.5 rounded-lg bg-slate-100">✓ 事前オンライン宿泊台帳対応</span>
                <span className="px-3 py-1.5 rounded-lg bg-slate-100">✓ 5秒CM枠とのセット優待あり</span>
              </div>
            </div>

            <div className="shrink-0 flex flex-col gap-3">
              <Link
                href="/contact"
                className="px-7 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm tracking-wider shadow-lg text-center transition-colors"
              >
                宿泊施設の掲載を申し込む →
              </Link>
              <span className="text-[11px] text-slate-500 text-center">
                担当スタッフより折り返しご案内いたします
              </span>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="bg-gradient-to-br from-slate-900 to-blue-950 rounded-3xl p-8 sm:p-12 text-center text-white space-y-5 shadow-xl">
          <h2 className="font-serif text-xl sm:text-3xl font-bold">
            まずは1島・1店舗から、お気軽にお問い合わせください
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed">
            「自島の観光協会でどんな連携ができるか知りたい」「夏休み期間だけお店のクーポンCMを出したい」など、ご予算・目的に合わせた最適なプランをご提案いたします。
          </p>
          <div className="pt-2">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-extrabold text-sm tracking-wider shadow-xl transition-all"
            >
              <Mail className="w-4 h-4" />
              お問い合わせ・資料請求フォームへ進む
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
