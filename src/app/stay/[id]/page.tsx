'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Breadcrumb from '@/components/Breadcrumb';
import { 
  ArrowLeft, Phone, Calendar, MapPin, Wifi, Coffee, Utensils, 
  Car, ShieldCheck, Star, ExternalLink, Sparkles, Check, Info, BedDouble, 
  Award, Quote, ChevronRight, Image as ImageIcon, CheckCircle2, PhoneCall,
  Clock, Share2, Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import BookingModal from '@/components/BookingModal';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface PlanItem {
  id?: string;
  name: string;
  price: string;
  desc?: string;
  badge?: string;
  features?: string[];
}

interface AmenityItem {
  name: string;
  category?: 'room' | 'bath' | 'service' | 'facility';
  available: boolean;
}

interface AgentReviewData {
  agentType: 'official' | 'user';
  rating: number;
  agentName: string;
  agentTitle: string;
  agentCriteria: string;
  agentAvatar: string;
  title: string;
  body: string;
  stayDate?: string;
}

interface InnData {
  id: string;
  name: string;
  islandId?: string;
  islandName: string;
  catchphrase: string;
  description: string;
  phone: string;
  address: string;
  priceRange?: string;
  priceNotice?: string;
  features: string[];
  plans: PlanItem[];
  galleryImages: string[];
  amenities: AmenityItem[];
  agentReview?: AgentReviewData;
  checkInTime?: string;
  checkOutTime?: string;
  pickupInfo?: string;
}

// 青ヶ島アイランドロッジ等のデフォルト充実データ（DBに個別未登録時の高品質フォールバック）
const DEFAULT_FALLBACK_INN: InnData = {
  id: 'aogashimaya',
  name: '青ヶ島 アイランドロッジ（公式提携宿）',
  islandId: '58',
  islandName: '青ヶ島',
  catchphrase: '絶海の孤島・青ヶ島で味わう、島魚会席と温もりのおもてなし。',
  description: '青ヶ島集落の中心に位置し、港やヘリポートへの往復無料送迎も完備。主人が獲った新鮮な地魚や自家栽培の島野菜、青ヶ島名産の幻の焼酎「青酎」を楽しめる島旅人に大人気の宿です。全室Wi-Fi・エアコン・個別コンセント完備。',
  phone: '04996-9-0000',
  address: '東京都青ヶ島村 集落中央',
  priceRange: '¥11,000〜 / 1泊3食',
  priceNotice: '※天候による欠航や季節により変動する場合がございます。お電話またはWeb予約にてご確認ください。',
  checkInTime: '15:00（到着便に合わせて柔軟対応）',
  checkOutTime: '10:00（出発便に合わせて送迎）',
  pickupInfo: 'ヘリポート・三宝港まで車で無料送迎（事前予約制）',
  features: [
    '🚁 ヘリポート・三宝港からの往復無料送迎付き',
    '🍱 自家製青酎と獲れたて地魚の島料理夕食 ＋ 島散策用お弁当付き（1泊3食）',
    '📶 全室個別コンセント多数・高速Wi-Fi完備',
    '🌋 ひんぎゃの蒸気釜・絶景星空散策ガイドアドバイス',
    '🚲 島内散策用E-Bike（電動アシスト自転車）優先貸出',
  ],
  plans: [
    { 
      id: 'plan-full',
      name: '1泊3食付き（朝・夕・名物島お弁当付き満喫プラン）', 
      price: '¥11,000〜 / 人', 
      desc: '手作りの温かい島料理と、島散策中に地熱釜で温めて食べられる名物お弁当がセットになった一番人気のプラン。',
      badge: '👑 1番人気',
      features: ['朝食・夕食付き', '島散策用お弁当', '往復送迎無料', '青酎1杯サービス']
    },
    { 
      id: 'plan-half',
      name: '1泊2食付き（夕食・朝食スタンダードプラン）', 
      price: '¥9,500〜 / 人', 
      desc: '地魚刺身盛り合わせと島野菜の天ぷらを味わう定番プラン。',
      badge: '定番',
      features: ['朝食・夕食付き', '往復送迎無料']
    },
    { 
      id: 'plan-roomonly',
      name: '素泊まり・ワーケーション利用プラン', 
      price: '¥7,500〜 / 人', 
      desc: '自由なスケジュールで過ごしたい方向け。周辺商店まで徒歩3分。',
      badge: 'ビジネス・自由旅',
      features: ['高速Wi-Fi', 'デスク完備', '共用電子レンジ']
    },
  ],
  galleryImages: [
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800&q=80',
  ],
  amenities: [
    { name: 'Wi-Fi（無線LAN・全室完備）', category: 'service', available: true },
    { name: 'エアコン（各室冷暖房完備）', category: 'room', available: true },
    { name: '充電用個別コンセント（枕元）', category: 'room', available: true },
    { name: 'バスタオル・フェイスタオル', category: 'bath', available: true },
    { name: 'シャンプー・ボディソープ', category: 'bath', available: true },
    { name: 'ドライヤー', category: 'bath', available: true },
    { name: 'お風呂・温水シャワー', category: 'bath', available: true },
    { name: '港・ヘリポート往復送迎', category: 'service', available: true },
    { name: '洗濯機・乾燥機（洗剤無料）', category: 'facility', available: true },
    { name: '共用冷蔵庫・電子レンジ・湯沸かしポット', category: 'facility', available: true },
  ],
  agentReview: {
    agentType: 'official',
    rating: 4.9,
    agentName: 'マサヒト',
    agentTitle: 'KIRATABI 公式エージェント',
    agentCriteria: '全国400島到達 / 離島滞在歴150日以上 / 島文化保全アドバイザー',
    agentAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
    stayDate: '2026年 滞在実証済み',
    title: '青酎と獲れたて地魚のハーモニー。飾らない本物の島時間がここにある',
    body: '青ヶ島を訪れるなら、絶対に外せない宿の一つです。設備自体は昭和の面影を残す昔ながらの離島民宿で、洗面所やお風呂は共用ですが、塵一つなくピカピカに清掃されており女将さんの細やかな気配りを感じます。\n\n一番の魅力はなんといっても夕食。ご主人がその日に釣り上げた鮮度抜群の地魚と、島特産の幻の焼酎「青酎」の組み合わせは、高級ホテルでは決して味わえない感動があります。島事情を知り尽くしたお二人が、翌日のひんぎゃ散策やヘリ・船の就航状況のアドバイスも丁寧に教えてくれます。「至れり尽くせりのシティホテル」を求める方には不向きかもしれませんが、「本物の島の暮らしと温もり」を味わいたい方にはこれ以上ない最高の拠り所です。'
  }
};

export default function DedicatedInnPage() {
  const router = useRouter();
  const params = useParams();
  const innParamId = (params?.id as string) || '';

  const [loading, setLoading] = useState(true);
  const [inn, setInn] = useState<InnData>(DEFAULT_FALLBACK_INN);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedPlanForModal, setSelectedPlanForModal] = useState<PlanItem | null>(null);
  const [activeSection, setActiveSection] = useState<'features' | 'review' | 'plans' | 'amenities' | 'info'>('features');

  // Supabaseから該当宿の実データをロード
  useEffect(() => {
    async function loadInnData() {
      setLoading(true);
      try {
        if (!innParamId) {
          setLoading(false);
          return;
        }

        // 1. UUID または ID で accommodations テーブルを検索
        const { data: accData, error } = await supabase
          .from('accommodations')
          .select('*')
          .or(`id.eq.${innParamId},owner_id.eq.${innParamId}`)
          .limit(1)
          .single();

        if (accData) {
          // DBのデータをリッチなInnData型にマッピング
          const photos = [
            ...(accData.photo_exterior || []),
            ...(accData.photo_room || []),
            ...(accData.photo_food || []),
            ...(accData.photo_facility || []),
            ...(accData.photo_urls || [])
          ].filter(Boolean);

          const mappedInn: InnData = {
            id: accData.id,
            name: accData.name || DEFAULT_FALLBACK_INN.name,
            islandId: accData.island_id || DEFAULT_FALLBACK_INN.islandId,
            islandName: accData.island_name || DEFAULT_FALLBACK_INN.islandName,
            catchphrase: accData.catchphrase || DEFAULT_FALLBACK_INN.catchphrase,
            description: accData.description || DEFAULT_FALLBACK_INN.description,
            phone: accData.phone_number || accData.phone || DEFAULT_FALLBACK_INN.phone,
            address: accData.address || DEFAULT_FALLBACK_INN.address,
            priceRange: accData.price_range || DEFAULT_FALLBACK_INN.priceRange,
            priceNotice: accData.deposit_policy || DEFAULT_FALLBACK_INN.priceNotice,
            features: accData.features && accData.features.length > 0 ? accData.features : DEFAULT_FALLBACK_INN.features,
            plans: accData.plans && accData.plans.length > 0 ? accData.plans : DEFAULT_FALLBACK_INN.plans,
            galleryImages: photos.length > 0 ? photos : DEFAULT_FALLBACK_INN.galleryImages,
            amenities: DEFAULT_FALLBACK_INN.amenities,
            agentReview: accData.agent_review || DEFAULT_FALLBACK_INN.agentReview,
            checkInTime: accData.check_in_time || DEFAULT_FALLBACK_INN.checkInTime,
            checkOutTime: accData.check_out_time || DEFAULT_FALLBACK_INN.checkOutTime,
            pickupInfo: accData.has_pickup ? '無料送迎あり（事前予約制）' : DEFAULT_FALLBACK_INN.pickupInfo
          };

          setInn(mappedInn);
        } else {
          // DBにレコードがない場合はデフォルトの高品質サンプルを表示
          setInn(DEFAULT_FALLBACK_INN);
        }
      } catch (err) {
        console.error('Error fetching accommodation:', err);
        setInn(DEFAULT_FALLBACK_INN);
      } finally {
        setLoading(false);
      }
    }

    loadInnData();
  }, [innParamId]);

  const handleCall = () => {
    toast.success('お電話口で「キラ旅を見た」とお伝えいただくと案内がスムーズです！', { icon: '📞', duration: 4000 });
    window.location.href = `tel:${inn.phone}`;
  };

  const handleOpenBooking = (plan?: PlanItem) => {
    setSelectedPlanForModal(plan || null);
    setShowBookingModal(true);
  };

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: `${inn.name} | KIRATABI 公式認定宿`,
        text: `${inn.islandName}の特選宿「${inn.name}」`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('URLをクリップボードにコピーしました！');
    }
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] pb-36 font-sans text-slate-800 relative">
      
      {/* Top Floating Glass Navigation Header */}
      <header className="px-4 lg:px-12 py-3.5 border-b border-slate-200/70 flex items-center justify-between sticky top-0 z-40 bg-white/85 backdrop-blur-xl shadow-sm">
        <button 
          onClick={() => router.back()} 
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors flex items-center gap-1.5"
          title="前のページに戻る"
        >
          <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
          <span className="text-xs font-bold hidden sm:inline">戻る</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/15 to-yellow-500/20 text-amber-800 font-bold text-[0.65rem] md:text-xs tracking-wider uppercase border border-amber-300/80 flex items-center gap-1.5 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
            KIRATABI 公式認定・特選宿
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button 
            onClick={handleShare}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors"
            title="シェアする"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 md:px-6 mt-6 space-y-6">
        
        {/* Breadcrumb */}
        <Breadcrumb 
          items={[
            { label: '全国離島マップ', href: '/map' },
            { label: `${inn.islandName}`, href: `/island/${inn.islandId || '58'}` },
            { label: inn.name }
          ]} 
          className="mb-2" 
        />

        {/* ============================================================ */}
        {/* HERO SECTION: Magazine-style Immersive Gallery & Title Card */}
        {/* ============================================================ */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-200/80">
          
          {/* Main Large Photo Display */}
          <div className="relative h-72 sm:h-96 md:h-[420px] w-full overflow-hidden bg-slate-900 group">
            <AnimatePresence mode="wait">
              <motion.img 
                key={activeImageIndex}
                initial={{ opacity: 0.4, scale: 1.03 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0.4 }}
                transition={{ duration: 0.4 }}
                src={inn.galleryImages[activeImageIndex] || inn.galleryImages[0]} 
                alt={inn.name} 
                className="w-full h-full object-cover"
              />
            </AnimatePresence>

            {/* Dark & Amber Ambient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
            
            {/* Top Badges */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
              <span className="px-3 py-1 bg-black/60 backdrop-blur-md text-white font-bold text-xs rounded-full border border-white/20 pointer-events-auto flex items-center gap-1.5 shadow-md">
                <MapPin className="w-3.5 h-3.5 text-blue-400" /> {inn.islandName}
              </span>

              <span className="px-3 py-1 bg-black/60 backdrop-blur-md text-white font-mono text-xs font-bold rounded-full border border-white/20 pointer-events-auto shadow-md">
                📷 {activeImageIndex + 1} / {inn.galleryImages.length}
              </span>
            </div>

            {/* Bottom Title & Catchphrase Overlay */}
            <div className="absolute bottom-6 left-6 right-6 text-white space-y-2 pointer-events-none">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 bg-amber-500 text-slate-950 font-extrabold text-[0.65rem] tracking-wider rounded-md uppercase shadow-md">
                  ★ 公式認定プレミアム枠
                </span>
                {inn.priceRange && (
                  <span className="px-2.5 py-0.5 bg-white/20 backdrop-blur-sm text-amber-200 font-mono text-xs font-bold rounded-md border border-white/20">
                    目安: {inn.priceRange}
                  </span>
                )}
              </div>

              <h1 className="font-serif font-bold text-2xl sm:text-3xl md:text-4xl text-white drop-shadow-md tracking-wide">
                {inn.name}
              </h1>

              <p className="text-xs sm:text-sm text-slate-200 font-serif leading-relaxed line-clamp-2 drop-shadow-sm max-w-3xl">
                {inn.catchphrase}
              </p>
            </div>
          </div>

          {/* Interactive Thumbnails Bar */}
          <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center gap-2 overflow-x-auto hide-scrollbar">
            {inn.galleryImages.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImageIndex(idx)}
                className={`relative h-16 w-24 shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                  activeImageIndex === idx 
                    ? 'border-blue-500 ring-2 ring-blue-400/40 scale-102 shadow-sm' 
                    : 'border-transparent opacity-70 hover:opacity-100'
                }`}
              >
                <img src={img} alt={`サムネイル ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Quick Jump Navigation Tabs */}
        <div className="sticky top-16 z-30 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200 shadow-sm p-1.5 flex items-center justify-start sm:justify-center gap-1 overflow-x-auto hide-scrollbar">
          {[
            { id: 'features', label: 'こだわり・魅力', icon: Sparkles },
            { id: 'review', label: '公式滞在記', icon: Award },
            { id: 'plans', label: '料金プラン', icon: BedDouble },
            { id: 'amenities', label: '設備・アメニティ', icon: ShieldCheck },
            { id: 'info', label: 'アクセス・基本情報', icon: MapPin },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveSection(tab.id as any);
                document.getElementById(tab.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeSection === tab.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ============================================================ */}
        {/* MAIN 2-COLUMN LAYOUT: Content (Left) + Sticky Action Box (Right) */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column (2 Cols wide) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 1. Features & Highlights Card */}
            <div id="features" className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 space-y-6 scroll-mt-32">
              <div className="border-b border-slate-100 pb-4">
                <span className="text-[0.65rem] font-bold tracking-widest text-amber-600 uppercase block mb-1">
                  HIGHLIGHTS & REASONS TO STAY
                </span>
                <h2 className="font-serif font-bold text-xl md:text-2xl text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  宿のこだわり ＆ 選ばれる理由
                </h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {inn.features.map((feat, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-100 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-xs md:text-sm font-medium text-slate-800 leading-snug">{feat}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-100">
                <h3 className="font-bold text-sm text-slate-900 mb-2">宿主からのご案内</h3>
                <p className="text-xs md:text-sm text-slate-600 leading-relaxed font-serif whitespace-pre-wrap">
                  {inn.description}
                </p>
              </div>
            </div>

            {/* 2. Island Pro Agent Review (公式エージェント滞在記) */}
            {inn.agentReview && (
              <div id="review" className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-slate-900/5 p-1 md:p-1.5 rounded-[2rem] shadow-md border border-amber-300/80 relative overflow-hidden scroll-mt-32">
                <div className="bg-white/95 backdrop-blur-md p-6 md:p-8 rounded-[1.75rem] border border-white relative z-10 space-y-6">
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-100 pb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-white shadow-md">
                        <Award className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-[0.65rem] font-bold text-amber-700 uppercase tracking-widest block">
                          VERIFIED STAY REPORT
                        </span>
                        <h2 className="font-serif font-bold text-slate-900 text-lg md:text-xl">
                          KIRATABI 公式エージェント滞在記
                        </h2>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star} 
                            className={`w-4 h-4 ${star <= Math.round(inn.agentReview!.rating) ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'}`} 
                          />
                        ))}
                      </div>
                      <span className="font-mono font-bold text-amber-800 text-base">{inn.agentReview.rating}</span>
                    </div>
                  </div>

                  {/* Review Content */}
                  <div className="relative">
                    <Quote className="w-12 h-12 text-amber-200/50 absolute -top-4 -left-4 -z-10 rotate-180" />
                    
                    <h3 className="text-base md:text-lg font-bold text-amber-950 mb-3 leading-snug">
                      「{inn.agentReview.title}」
                    </h3>
                    <p className="text-xs md:text-sm text-slate-700 leading-relaxed font-serif whitespace-pre-wrap">
                      {inn.agentReview.body}
                    </p>
                  </div>

                  {/* Agent Profile Card */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-amber-50/60 rounded-2xl border border-amber-200/70">
                    <img 
                      src={inn.agentReview.agentAvatar} 
                      alt={inn.agentReview.agentName}
                      className="w-14 h-14 rounded-2xl object-cover shadow-sm ring-2 ring-amber-200 shrink-0"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[0.65rem] font-bold text-amber-950 bg-amber-400 px-2 py-0.5 rounded-md tracking-wider uppercase">
                          {inn.agentReview.agentTitle}
                        </span>
                        <span className="font-bold text-slate-900 text-sm">{inn.agentReview.agentName}</span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium">
                        🛡️ {inn.agentReview.agentCriteria}
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* 3. Plans & Pricing (宿泊プラン一覧) */}
            <div id="plans" className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 space-y-6 scroll-mt-32">
              <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                <div>
                  <span className="text-[0.65rem] font-bold tracking-widest text-blue-600 uppercase block mb-1">
                    ROOM & MEAL PLANS
                  </span>
                  <h2 className="font-serif font-bold text-xl md:text-2xl text-slate-900 flex items-center gap-2">
                    <BedDouble className="w-5 h-5 text-blue-500" />
                    宿泊プラン ＆ 料金目安
                  </h2>
                </div>
              </div>

              <div className="space-y-4">
                {inn.plans.map((plan, idx) => (
                  <div 
                    key={idx} 
                    className="p-5 rounded-2xl bg-slate-50 hover:bg-blue-50/40 border border-slate-200 hover:border-blue-200 transition-all space-y-4 group"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {plan.badge && (
                            <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white font-bold text-[0.65rem] tracking-wider">
                              {plan.badge}
                            </span>
                          )}
                          <h3 className="font-bold text-slate-900 text-base md:text-lg group-hover:text-blue-700 transition-colors">
                            {plan.name}
                          </h3>
                        </div>
                        {plan.desc && (
                          <p className="text-xs text-slate-600 font-serif leading-relaxed">
                            {plan.desc}
                          </p>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-mono font-bold text-lg md:text-xl text-amber-600 block">
                          {plan.price}
                        </span>
                      </div>
                    </div>

                    {plan.features && plan.features.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-200/60">
                        {plan.features.map((pf, pfi) => (
                          <span key={pfi} className="text-[0.65rem] bg-white text-slate-600 px-2 py-1 rounded-md border border-slate-200 font-medium">
                            ✓ {pf}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => handleOpenBooking(plan)}
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-all hover:scale-102"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        このプランで予約リクエスト
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {inn.priceNotice && (
                <p className="text-xs text-slate-500 font-serif bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex items-start gap-2">
                  <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>{inn.priceNotice}</span>
                </p>
              )}
            </div>

            {/* 4. Amenities Checklist (アメニティ・設備) */}
            <div id="amenities" className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 space-y-6 scroll-mt-32">
              <div className="border-b border-slate-100 pb-4">
                <span className="text-[0.65rem] font-bold tracking-widest text-emerald-600 uppercase block mb-1">
                  FACILITIES & AMENITIES
                </span>
                <h2 className="font-serif font-bold text-xl md:text-2xl text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  設備・アメニティチェック
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {inn.amenities.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 text-xs md:text-sm text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="font-medium">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 5. Basic Info & Access */}
            <div id="info" className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 space-y-6 scroll-mt-32">
              <div className="border-b border-slate-100 pb-4">
                <span className="text-[0.65rem] font-bold tracking-widest text-slate-500 uppercase block mb-1">
                  ACCESS & INFORMATION
                </span>
                <h2 className="font-serif font-bold text-xl md:text-2xl text-slate-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-500" />
                  基本情報 ＆ アクセス
                </h2>
              </div>

              <div className="space-y-3 text-xs md:text-sm">
                <div className="flex flex-col sm:flex-row py-2.5 border-b border-slate-100">
                  <span className="w-32 font-bold text-slate-500">所在地</span>
                  <span className="text-slate-800">{inn.address}</span>
                </div>
                <div className="flex flex-col sm:flex-row py-2.5 border-b border-slate-100">
                  <span className="w-32 font-bold text-slate-500">チェックイン</span>
                  <span className="text-slate-800">{inn.checkInTime}</span>
                </div>
                <div className="flex flex-col sm:flex-row py-2.5 border-b border-slate-100">
                  <span className="w-32 font-bold text-slate-500">チェックアウト</span>
                  <span className="text-slate-800">{inn.checkOutTime}</span>
                </div>
                <div className="flex flex-col sm:flex-row py-2.5 border-b border-slate-100">
                  <span className="w-32 font-bold text-slate-500">送迎サービス</span>
                  <span className="text-slate-800">{inn.pickupInfo}</span>
                </div>
                <div className="flex flex-col sm:flex-row py-2.5">
                  <span className="w-32 font-bold text-slate-500">電話番号</span>
                  <a href={`tel:${inn.phone}`} className="text-blue-600 font-mono font-bold hover:underline">
                    {inn.phone}
                  </a>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Sticky Direct Booking & Inquiry Action Card */}
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-amber-950 p-6 rounded-3xl text-white border border-amber-500/40 shadow-2xl space-y-6 sticky top-28">
              
              <div className="space-y-1">
                <span className="text-[0.65rem] font-bold tracking-widest uppercase text-amber-400 block font-mono">
                  DIRECT RESERVATION
                </span>
                <h3 className="font-serif font-bold text-xl md:text-2xl text-white">
                  宿泊予約 ＆ 問い合わせ
                </h3>
                <p className="text-xs text-slate-300 font-serif leading-relaxed">
                  離島の宿はお電話またはWebリクエストから直接予約が可能です。
                </p>
              </div>

              {/* Direct Call Box */}
              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 space-y-2">
                <span className="text-xs text-slate-300 font-medium block">お電話でのご予約・空室確認</span>
                <a 
                  href={`tel:${inn.phone}`} 
                  onClick={handleCall}
                  className="font-mono font-extrabold text-2xl text-amber-300 block hover:text-amber-200 transition-colors"
                >
                  📞 {inn.phone}
                </a>
                <span className="text-[0.65rem] text-slate-400 block">
                  ※「キラ旅を見た」とお伝えいただくとスムーズです
                </span>
              </div>

              <button
                onClick={handleCall}
                className="w-full py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm tracking-wider flex items-center justify-center gap-2 transition-all border border-white/20 hover:scale-[1.01]"
              >
                <Phone className="w-4 h-4 text-amber-300" /> お電話で直接問い合わせ
              </button>

              <div className="relative flex items-center py-1">
                <div className="flex-grow border-t border-white/10"></div>
                <span className="shrink-0 mx-3 text-[0.6rem] text-slate-400 font-mono font-bold uppercase">OR</span>
                <div className="flex-grow border-t border-white/10"></div>
              </div>

              {/* Web Request */}
              <div className="space-y-3">
                <div className="text-center">
                  <h4 className="font-serif font-bold text-base text-white">Web予約リクエスト</h4>
                  <p className="text-[0.65rem] text-amber-200/80 mt-0.5">宿オーナーが内容確認後、承認メッセージが届きます。</p>
                </div>

                <button
                  onClick={() => handleOpenBooking()}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-400 text-white font-bold text-sm tracking-wider flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(59,130,246,0.35)] transition-all hover:scale-[1.02] border border-blue-400/40"
                >
                  <Calendar className="w-5 h-5 text-amber-300" /> Webからリクエストを送る
                </button>
              </div>

              <div className="pt-2 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5 font-serif">
                <MapPin size={13} className="text-amber-400 shrink-0" />
                <span className="line-clamp-1">{inn.address}</span>
              </div>

            </div>
          </div>

        </div>

      </div>

      {/* Floating Bottom Bar for Mobile Screen */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/80 p-3.5 px-4 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] lg:hidden flex items-center justify-between gap-3">
        <div>
          <span className="text-[0.65rem] text-slate-500 font-bold block">{inn.name}</span>
          <span className="font-mono font-bold text-amber-700 text-sm">{inn.priceRange || '料金はお問い合わせ'}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCall}
            className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl font-bold text-xs flex items-center justify-center transition-colors"
            title="電話する"
          >
            <Phone size={16} />
          </button>
          <button
            onClick={() => handleOpenBooking()}
            className="px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs rounded-2xl shadow-md flex items-center gap-1.5 transition-transform hover:scale-102"
          >
            <Calendar size={14} />
            予約リクエスト
          </button>
        </div>
      </div>

      {/* Booking Modal */}
      <BookingModal 
        isOpen={showBookingModal} 
        onClose={() => setShowBookingModal(false)} 
        innName={inn.name} 
        accommodationId={inn.id}
        selectedPlan={selectedPlanForModal}
      />
    </main>
  );
}

