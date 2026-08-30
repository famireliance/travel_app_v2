'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Breadcrumb from '@/components/Breadcrumb';
import { 
  ArrowLeft, Phone, Calendar, MapPin, Wifi, Coffee, Utensils, 
  Car, ShieldCheck, Star, ExternalLink, Sparkles, Check, Info, BedDouble, Award, Quote
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import BookingModal from '@/components/BookingModal';

export default function DedicatedInnPage() {
  const router = useRouter();
  const params = useParams();
  const innId = params?.id as string;
  const [showBookingModal, setShowBookingModal] = useState(false);

  // Sample data for sponsored inn "KIRATABI Island Lodge" (Fictional) or fallback
  const innData = {
    name: 'KIRATABI アイランドロッジ（テスト用架空宿）',
    islandName: '青ヶ島',
    catchphrase: '絶海の孤島・青ヶ島で味わう、真心込めた島料理と温もりのおもてなし。',
    description: '青ヶ島集落の中心に位置し、港やヘリポートへの送迎も完備。主人が獲った新鮮な地魚や自家栽培の島野菜、青ヶ島名産の焼酎「青酎」を楽しめる島旅人に大人気の宿です。全室Wi-Fi・エアコン・個別コンセント完備。',
    phone: '000-000-0000',
    address: '東京都青ヶ島村 テスト番地',
    priceNotice: '※季節や予約状況によって変動する場合がございます。お電話にてご確認ください。',
    features: [
      'ヘリポート・港からの往復無料送迎付き',
      '自家製青酎と獲れたて地魚の島料理夕食 ＋ 島散策用お弁当付き（1泊3食）',
      '全室コンセント多数・高速Wi-Fi完備',
      'ひんぎゃの蒸気釜散策ガイドアドバイス',
    ],
    plans: [
      { name: '1泊3食付き（朝食・夕食・島散策用お弁当付き）', price: '¥11,000〜 / 人', desc: '手作りの温かい島料理と、島巡り中に食べられる名物お弁当がセットになった満喫プラン。' },
      { name: '素泊まり・ビジネス利用プラン', price: '¥7,500〜 / 人', desc: '自由なスケジュールで過ごしたい方向け。周辺商店まで徒歩3分。' },
    ],
    galleryImages: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80',
    ],
    amenities: [
      { name: 'Wi-Fi（無線LAN）', available: true },
      { name: 'エアコン（冷暖房）', available: true },
      { name: '充電用コンセント（枕元）', available: true },
      { name: 'バスタオル・フェイスタオル', available: true },
      { name: 'ドライヤー', available: true },
      { name: 'お風呂・シャワー', available: true },
      { name: '港・ヘリポート送迎', available: true },
      { name: 'コインランドリー・洗濯機', available: true },
    ],
    agentReview: {
      agentType: 'official', // 'official' (運営直) or 'user' (ユーザーエージェント)
      rating: 4.8,
      agentName: 'マサヒト',
      agentTitle: 'KIRATABI 公式エージェント',
      agentCriteria: '離島滞在歴150日以上 / 島文化保全アドバイザー',
      agentAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
      title: '青酎と地魚のハーモニー。飾らない島時間がここにある',
      body: '青ヶ島を訪れるなら、絶対に外せない宿の一つです。設備自体は昭和の面影を残す昔ながらの民宿で、洗面所やお風呂は共用ですが、塵一つなくピカピカに清掃されており女将さんの細やかな気配りを感じます。\n\n一番の魅力はなんといっても夕食。ご主人がその日に釣り上げた鮮度抜群の地魚と、自家製の幻の焼酎「青酎」の組み合わせは、高級ホテルでは決して味わえない感動があります。島事情を知り尽くしたお二人が、翌日のひんぎゃ散策のアドバイスも丁寧に教えてくれます。「至れり尽くせりのサービス」を求める方には不向きかもしれませんが、「本物の島の暮らし」を味わいたい方にはこれ以上ない最高の拠り所です。'
    }
  };

  const handleCall = () => {
    toast.success('お電話口で「キラ旅を見た」とお伝えいただくとスムーズです！');
    window.location.href = `tel:${innData.phone}`;
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] pb-32 font-sans text-slate-800 relative">
      {/* Top Bar */}
      <header className="px-6 lg:px-12 py-4 border-b border-slate-200/60 flex items-center justify-between sticky top-0 z-40 bg-white/80 backdrop-blur-md shadow-sm">
        <button 
          onClick={() => router.back()} 
          className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
        </button>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-700 font-bold text-[0.65rem] tracking-wider uppercase border border-amber-300">
            🌟 KIRATABI 公式認定・特設宿
          </span>
        </div>
        <div className="w-8" />
      </header>

      <div className="max-w-4xl mx-auto px-4 md:px-6 mt-6 space-y-6">
        <Breadcrumb 
          items={[
            { label: '全国離島マップ', href: '/map' },
            { label: `${innData.islandName}`, href: '/map' },
            { label: innData.name }
          ]} 
          className="mb-2" 
        />

        {/* Hero Gallery */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-200">
          <div className="relative h-64 md:h-96 w-full overflow-hidden">
            <img 
              src={innData.galleryImages[0]} 
              alt={innData.name} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-black/20 to-transparent" />
            
            <div className="absolute bottom-6 left-6 right-6 text-white space-y-2">
              <span className="px-3 py-1 bg-amber-500 text-slate-950 font-extrabold text-xs rounded-full inline-block shadow-md">
                📍 {innData.islandName}
              </span>
              <h1 className="font-serif font-bold text-2xl md:text-4xl text-white drop-shadow-md">
                {innData.name}
              </h1>
              <p className="text-xs md:text-sm text-slate-200 font-serif">
                {innData.catchphrase}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 border-t border-slate-100">
            {innData.galleryImages.slice(1).map((img, idx) => (
              <div key={idx} className="h-28 md:h-36 rounded-2xl overflow-hidden">
                <img src={img} alt="ギャラリー写真" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left 2 Cols: Details */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Features Card */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-4">
              <h2 className="font-serif font-bold text-slate-900 text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" /> 宿のこだわり・おすすめポイント
              </h2>
              
              <ul className="space-y-2.5">
                {innData.features.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs md:text-sm text-slate-700 font-medium">
                    <Check className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>

              <div className="pt-4 border-t border-slate-100">
                <h3 className="font-bold text-sm text-slate-800 mb-2">宿のご案内</h3>
                <p className="text-xs md:text-sm text-slate-600 leading-relaxed font-serif whitespace-pre-wrap">
                  {innData.description}
                </p>
              </div>
            </div>

            {/* Island Pro Agent Review (有料プラン機能) */}
            {innData.agentReview && (
              <div className="bg-gradient-to-br from-amber-50 to-orange-50/30 p-1 md:p-1.5 rounded-[2rem] shadow-sm border border-amber-200/60 relative overflow-hidden">
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
                
                <div className="bg-white/80 backdrop-blur-md p-6 md:p-8 rounded-[1.75rem] border border-white relative z-10">
                  <div className="flex items-center gap-2 mb-6">
                    <Award className={`w-6 h-6 ${innData.agentReview.agentType === 'official' ? 'text-amber-500' : 'text-emerald-500'}`} />
                    <h2 className="font-serif font-bold text-slate-900 text-lg md:text-xl">
                      {innData.agentReview.agentType === 'official' ? 'KIRATABI 公式エージェント滞在記' : 'KIRATABI 認定ユーザー滞在記'}
                    </h2>
                  </div>

                  {/* Review Body */}
                  <div className="mb-8 relative">
                    <Quote className="w-10 h-10 text-amber-200/50 absolute -top-4 -left-4 -z-10 rotate-180" />
                    
                    {/* Star Rating Addition */}
                    <div className="flex items-center gap-1.5 mb-3">
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className={`w-5 h-5 ${star <= Math.round(innData.agentReview.rating!) ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'}`} />
                        ))}
                      </div>
                      <span className="font-bold text-amber-600 text-lg">{innData.agentReview.rating}</span>
                    </div>

                    <h3 className="text-base md:text-lg font-bold text-amber-900 mb-3 leading-snug">
                      「{innData.agentReview.title}」
                    </h3>
                    <p className="text-sm md:text-base text-slate-700 leading-loose font-serif whitespace-pre-wrap relative z-10">
                      {innData.agentReview.body}
                    </p>
                  </div>

                  {/* Profile Section */}
                  <div className="flex flex-col md:flex-row md:items-center gap-4 p-4 bg-white/90 rounded-2xl border border-amber-100 shadow-sm">
                    <img 
                      src={innData.agentReview.agentAvatar} 
                      alt={innData.agentReview.agentName}
                      className="w-14 h-14 rounded-full object-cover shadow-sm ring-2 ring-amber-100"
                    />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] md:text-xs font-bold text-white px-2 py-0.5 rounded-full tracking-wider ${
                          innData.agentReview.agentType === 'official' ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}>
                          {innData.agentReview.agentTitle}
                        </span>
                      </div>
                      <p className="font-bold text-slate-900">{innData.agentReview.agentName}</p>
                      <p className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-1.5">
                        <ShieldCheck className={`w-3.5 h-3.5 ${innData.agentReview.agentType === 'official' ? 'text-amber-500' : 'text-emerald-500'}`} />
                        選定基準: {innData.agentReview.agentCriteria}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Plans & Pricing Table */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-4">
              <h2 className="font-serif font-bold text-slate-900 text-lg flex items-center gap-2">
                <BedDouble className="w-5 h-5 text-blue-500" /> 宿泊プラン・料金目安
              </h2>

              <div className="space-y-3">
                {innData.plans.map((plan, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm md:text-base">{plan.name}</h3>
                      <p className="text-xs text-slate-500 mt-1">{plan.desc}</p>
                    </div>
                    <span className="font-mono font-bold text-amber-600 text-base shrink-0 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 self-start md:self-auto">
                      {plan.price}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-[0.7rem] text-slate-400">{innData.priceNotice}</p>
            </div>

            {/* Amenities Grid */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-4">
              <h2 className="font-serif font-bold text-slate-900 text-lg flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" /> 設備・アメニティチェック
              </h2>

              <div className="grid grid-cols-2 gap-3">
                {innData.amenities.map((amenity, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs md:text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{amenity.name}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Col: Booking Action Box */}
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-amber-950 p-6 rounded-3xl text-white border border-amber-500/30 shadow-xl space-y-5 sticky top-24">
              <div className="space-y-1">
                <span className="text-[0.65rem] font-bold tracking-widest uppercase text-amber-400 block">DIRECT BOOKING</span>
                <h3 className="font-serif font-bold text-xl text-white">直接予約・お問い合わせ</h3>
                <p className="text-xs text-slate-300">離島の宿はお電話での予約確定が最も確実にスムーズです！</p>
              </div>

              <div className="p-4 bg-white/10 rounded-2xl border border-white/10 space-y-2">
                <span className="text-xs text-slate-300 block">ご予約電話番号</span>
                <a href={`tel:${innData.phone}`} className="font-mono font-bold text-2xl text-amber-400 block hover:underline">
                  📞 {innData.phone}
                </a>
                <span className="text-[0.65rem] text-slate-400 block">「キラ旅を見た」とお伝えいただくとスムーズです</span>
              </div>

              <button
                onClick={handleCall}
                className="w-full py-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm tracking-wider flex items-center justify-center gap-2 transition-colors border border-white/20"
              >
                <Phone className="w-4 h-4" /> お電話での問い合わせ
              </button>

              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-white/10"></div>
                <span className="shrink-0 mx-4 text-[0.6rem] text-slate-400 font-bold tracking-widest uppercase">OR</span>
                <div className="flex-grow border-t border-white/10"></div>
              </div>

              <div className="space-y-1 text-center mb-2">
                <h3 className="font-serif font-bold text-lg text-white">Web予約リクエスト</h3>
                <p className="text-[0.65rem] text-amber-200/80">宿が内容を確認後、承認メッセージが届きます。</p>
              </div>

              <button
                onClick={() => setShowBookingModal(true)}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-transform hover:scale-102 border border-blue-400/30"
              >
                <Calendar className="w-5 h-5" /> Webからリクエストを送る
              </button>

              <div className="pt-2 text-center">
                <span className="text-xs text-slate-400 flex items-center justify-center gap-1">
                  <MapPin size={12} /> {innData.address}
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Booking Modal */}
      <BookingModal 
        isOpen={showBookingModal} 
        onClose={() => setShowBookingModal(false)} 
        innName={innData.name} 
      />
    </main>
  );
}
