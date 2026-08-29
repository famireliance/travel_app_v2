'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Breadcrumb from '@/components/Breadcrumb';
import { 
  ArrowLeft, Phone, Calendar, MapPin, Wifi, Coffee, Utensils, 
  Car, ShieldCheck, Star, ExternalLink, Sparkles, Check, Info, BedDouble
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function DedicatedInnPage() {
  const router = useRouter();
  const params = useParams();
  const innId = params?.id as string;

  // Sample data for sponsored inn "あおがしま屋" (Aogashimaya) or fallback
  const innData = {
    name: 'あおがしま屋（公式特設ページ）',
    islandName: '青ヶ島',
    catchphrase: '絶海の孤島・青ヶ島で味わう、真心込めた島料理と温もりのおもてなし。',
    description: '青ヶ島集落の中心に位置し、港やヘリポートへの送迎も完備。主人が獲った新鮮な地魚や自家栽培の島野菜、青ヶ島名産の焼酎「青酎」を楽しめる島旅人に大人気の宿です。全室Wi-Fi・エアコン・個別コンセント完備。',
    phone: '04996-9-0185',
    address: '東京都青ヶ島村無番地',
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
    ]
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
                <p className="text-xs md:text-sm text-slate-600 leading-relaxed font-serif">
                  {innData.description}
                </p>
              </div>
            </div>

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
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-bold text-sm tracking-wider flex items-center justify-center gap-2 shadow-lg transition-transform hover:scale-102"
              >
                <Phone className="w-5 h-5" /> 今すぐ電話で予約する
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
    </main>
  );
}
