'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, MapPin, Phone, Car, ShieldCheck, Sparkles, 
  Calendar, CheckCircle2, ChevronRight, Share2, Star, Award, 
  Clock, Check, Compass, MessageCircle, Globe, ExternalLink,
  ChevronDown, ChevronUp, AlertCircle, Info, Fuel, Key, Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { getServiceById, IslandServiceItem, ServicePlanItem, ISLAND_SERVICES_DICTIONARY } from '@/data/islandServicesData';
import ServiceBookingModal from '@/components/ServiceBookingModal';

function InstagramIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
    </svg>
  );
}

function TwitterIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

export default function RentalCarLandingPage() {
  const params = useParams();
  const router = useRouter();
  const serviceId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [service, setService] = useState<IslandServiceItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedPlanForModal, setSelectedPlanForModal] = useState<ServicePlanItem | null>(null);
  const [showAllPlans, setShowAllPlans] = useState(false);

  useEffect(() => {
    if (!serviceId) return;
    const found = getServiceById(String(serviceId)) || ISLAND_SERVICES_DICTIONARY['aogashima-yamada-rentacar'];
    setService(found);
    setLoading(false);
  }, [serviceId]);

  if (loading || !service) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-mono tracking-widest uppercase font-bold">Loading Rental Car LP...</p>
        </div>
      </div>
    );
  }

  const handleOpenBooking = (plan?: ServicePlanItem) => {
    setSelectedPlanForModal(plan || null);
    setShowBookingModal(true);
  };

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: `${service.name} | KIRATABI 公式認定レンタカー`,
        text: `${service.islandName}のレンタカー「${service.name}」`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('URLをクリップボードにコピーしました！');
    }
  };

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${service.name} ${service.locationAddress}`)}`;
  const appleMapsUrl = `https://maps.apple.com/?q=${encodeURIComponent(`${service.name} ${service.locationAddress}`)}`;

  const visiblePlans = showAllPlans ? service.plans : service.plans.slice(0, 3);

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
          <span className="px-3 py-1 rounded-full bg-gradient-to-r from-blue-500/15 to-indigo-500/20 text-blue-800 font-bold text-[0.65rem] md:text-xs tracking-wider uppercase border border-blue-300/80 flex items-center gap-1.5 shadow-sm">
            <Car className="w-3.5 h-3.5 text-blue-600" />
            KIRATABI 公式認定・島内レンタカー
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={handleShare}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors"
            title="シェア"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button 
            onClick={() => handleOpenBooking()}
            className="hidden sm:flex px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all items-center gap-1.5"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>空き状況・Web予約</span>
          </button>
        </div>
      </header>

      {/* Hero Visual Showcase */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        <div className="relative rounded-[2rem] overflow-hidden shadow-xl border border-slate-200/80 bg-slate-900">
          <div className="relative h-[320px] sm:h-[420px] md:h-[500px] w-full">
            <img 
              src={service.photoUrls[activeImageIndex] || service.photoUrls[0]} 
              alt={service.name} 
              className="w-full h-full object-cover transition-all duration-700 brightness-95"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />

            {/* Top Badges */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
              <span className="px-3 py-1 bg-black/60 backdrop-blur-md text-white font-bold text-xs rounded-full border border-white/20 pointer-events-auto flex items-center gap-1.5 shadow-md">
                <MapPin className="w-3.5 h-3.5 text-blue-400" /> {service.islandName}
              </span>
              <span className="px-3 py-1 bg-black/60 backdrop-blur-md text-white font-mono text-xs font-bold rounded-full border border-white/20 pointer-events-auto shadow-md">
                📷 {activeImageIndex + 1} / {service.photoUrls.length}
              </span>
            </div>

            {/* Bottom Title & Catchphrases */}
            <div className="absolute bottom-6 left-6 right-6 text-white space-y-2 pointer-events-none">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 bg-blue-500 text-white font-extrabold text-[0.65rem] tracking-wider rounded-md uppercase shadow-md">
                  ★ 公式認定モビリティ
                </span>
                {service.priceRange && (
                  <span className="px-2.5 py-0.5 bg-white/20 backdrop-blur-sm text-amber-200 font-mono text-xs font-bold rounded-md border border-white/20">
                    目安: {service.priceRange}
                  </span>
                )}
                <span className="px-2.5 py-0.5 bg-emerald-500/80 backdrop-blur-sm text-white font-mono text-[0.65rem] font-bold rounded-md">
                  船・ヘリ欠航免除
                </span>
              </div>

              <h1 className="font-serif font-bold text-2xl sm:text-3xl md:text-4xl text-white drop-shadow-md tracking-wide">
                {service.name}
              </h1>

              <div className="space-y-1 max-w-3xl pt-0.5">
                {service.catchphrase.split('\n').filter(Boolean).map((line, idx) => (
                  <p key={idx} className="text-xs sm:text-sm text-slate-200 font-serif leading-relaxed drop-shadow-sm flex items-start gap-1.5">
                    <span className="text-blue-400 font-bold">・</span>
                    <span>{line}</span>
                  </p>
                ))}
              </div>
            </div>
          </div>

          {/* Thumbnails */}
          <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center gap-2 overflow-x-auto hide-scrollbar">
            {service.photoUrls.map((img, idx) => (
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

        {/* 2-Column Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start pt-4">
          
          {/* Left Column (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 1. Features & Highlights Card */}
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <span className="text-[0.65rem] font-bold tracking-widest text-blue-600 uppercase block mb-1 font-mono">
                  MOBILITY HIGHLIGHTS & PERKS
                </span>
                <h2 className="font-serif font-bold text-xl md:text-2xl text-slate-900 flex items-center gap-2">
                  <Car className="w-5 h-5 text-blue-500" />
                  レンタカーの特長 ＆ 充実サポート
                </h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {service.features.map((feat, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-blue-50/50 border border-blue-100 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <span className="text-xs md:text-sm font-medium text-slate-800 leading-snug">{feat}</span>
                  </div>
                ))}
              </div>

              {/* 欠航免除保証バナー */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-blue-500/5 border border-emerald-300/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white font-bold flex items-center justify-center text-lg shadow-sm">
                    🛡️
                  </div>
                  <div>
                    <strong className="text-xs md:text-sm text-slate-900 block font-serif">
                      天候・船・ヘリ欠航時はキャンセル料無料
                    </strong>
                    <p className="text-[0.7rem] text-slate-600">
                      離島特有の天候急変や交通遮断時も、直前キャンセル料は一切かかりません。
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <h3 className="font-bold text-sm text-slate-900 mb-2">ショップからのご案内</h3>
                <p className="text-xs md:text-sm text-slate-600 leading-relaxed font-serif whitespace-pre-wrap">
                  {service.description}
                </p>
              </div>
            </div>

            {/* 2. Plans List */}
            <div id="plans" className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[0.65rem] font-bold tracking-widest text-blue-600 uppercase block mb-1 font-mono">
                    RENTAL CAR PLANS & PRICING
                  </span>
                  <h2 className="font-serif font-bold text-xl md:text-2xl text-slate-900 flex items-center gap-2">
                    <Key className="w-5 h-5 text-indigo-500" />
                    料金プラン一覧 ({service.plans.length}件)
                  </h2>
                </div>
              </div>

              <div className="space-y-4">
                {visiblePlans.map((plan) => (
                  <div 
                    key={plan.id}
                    className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-slate-50 to-blue-50/30 border border-slate-200/90 shadow-sm space-y-4 hover:border-blue-300 transition-all group"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 border-b border-slate-200/60 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          {plan.badge && (
                            <span className="px-2.5 py-0.5 rounded-md bg-amber-500 text-slate-950 font-bold text-[0.65rem] shadow-xs">
                              ★ {plan.badge}
                            </span>
                          )}
                          <h3 className="font-serif font-bold text-base md:text-lg text-slate-900 group-hover:text-blue-700 transition-colors">
                            {plan.name}
                          </h3>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 font-serif leading-relaxed">
                          {plan.desc}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-serif font-bold text-xl md:text-2xl text-slate-900 block font-mono">
                          {plan.price}
                        </span>
                        <span className="text-[0.65rem] text-slate-400 block font-mono">
                          （免責補償・配車料込）
                        </span>
                      </div>
                    </div>

                    {plan.included && plan.included.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {plan.included.map((inc, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[0.65rem] font-bold text-slate-600 flex items-center gap-1">
                            <Check className="w-3 h-3 text-blue-500" /> {inc}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                      <div className="text-[0.7rem] text-slate-500 font-mono">
                        {plan.duration && `⏱ 利用時間: ${plan.duration}`}
                      </div>

                      <button
                        onClick={() => handleOpenBooking(plan)}
                        className="px-6 py-2.5 bg-slate-900 hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 group-hover:scale-102"
                      >
                        <Calendar className="w-4 h-4" />
                        このプランで予約リクエスト
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {service.plans.length > 3 && (
                <button
                  onClick={() => setShowAllPlans(!showAllPlans)}
                  className="w-full py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors flex items-center justify-center gap-1.5"
                >
                  {showAllPlans ? (
                    <>
                      <span>閉じる</span>
                      <ChevronUp className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <span>他のプランをもっと見る（残り{service.plans.length - 3}件）</span>
                      <ChevronDown className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>

            {/* 3. Verified Agent Review */}
            {service.agentReview && (
              <div className="bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-slate-900/5 p-1 rounded-[2rem] shadow-md border border-blue-300/80">
                <div className="bg-white/95 backdrop-blur-md p-6 md:p-8 rounded-[1.75rem] space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blue-100 pb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md">
                        <Award className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-[0.65rem] font-bold text-blue-700 uppercase tracking-widest block font-mono">
                          VERIFIED REPORT
                        </span>
                        <h2 className="font-serif font-bold text-slate-900 text-lg md:text-xl">
                          KIRATABI 公式調査員レポート
                        </h2>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200">
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className="w-4 h-4 text-amber-500 fill-amber-400" />
                        ))}
                      </div>
                      <span className="font-mono font-bold text-sm text-slate-800">5.0 / 5.0</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-serif font-bold text-base md:text-lg text-slate-900">
                      「{service.agentReview.title}」
                    </h3>
                    <p className="text-xs md:text-sm text-slate-600 font-serif leading-relaxed whitespace-pre-wrap">
                      {service.agentReview.comment}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                    {service.agentReview.tags.map((tag, i) => (
                      <span key={i} className="px-2.5 py-1 bg-blue-50 text-blue-800 text-xs font-bold rounded-lg border border-blue-100 font-serif">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 4. Map & Location */}
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 space-y-5">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-500" />
                配車場所・アクセス ＆ マップ
              </h3>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <p className="font-bold text-slate-800">📍 所在地: {service.locationAddress}</p>
                <p className="text-slate-600">🚗 配車対応: {service.pickupInfo}</p>
                <p className="text-slate-600">⏰ 営業時間: {service.businessHours}</p>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                >
                  <MapPin className="w-4 h-4" />
                  Googleマップで開く
                  <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                </a>

                <a
                  href={appleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                >
                  <Compass className="w-4 h-4" />
                  Appleマップで開く
                </a>
              </div>
            </div>

          </div>

          {/* Right Column: Sticky Booking Widget */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-200/90 space-y-5">
                <div className="border-b border-slate-100 pb-4">
                  <span className="text-[0.65rem] font-bold text-blue-600 uppercase tracking-widest font-mono block">
                    ONLINE RESERVATION
                  </span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-xs text-slate-500">料金目安</span>
                    <strong className="font-serif font-bold text-2xl text-slate-900 font-mono">
                      {service.priceRange}
                    </strong>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>港・空港・お宿への無料配車</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>全プラン免責補償（CDW）込み</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>船・ヘリ欠航時キャンセル料無料</span>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenBooking()}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  空き状況確認・Web予約へ
                </button>

                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <a
                    href={`tel:${service.phone}`}
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 font-mono"
                  >
                    <Phone className="w-3.5 h-3.5 text-blue-600" />
                    お電話: {service.phone}
                  </a>
                </div>
              </div>

              {/* SNS Card */}
              {(service.instagramUrl || service.lineUrl) && (
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-3">
                  <span className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-widest font-mono block">
                    OFFICIAL SNS
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {service.instagramUrl && (
                      <a
                        href={service.instagramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2 px-3 bg-pink-50 hover:bg-pink-100 text-pink-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                      >
                        <InstagramIcon className="w-4 h-4 text-pink-600" />
                        <span>Instagram</span>
                      </a>
                    )}
                    {service.lineUrl && (
                      <a
                        href={service.lineUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                      >
                        <MessageCircle className="w-4 h-4 text-emerald-600" />
                        <span>LINE公式</span>
                      </a>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      </div>

      {/* Booking Modal */}
      <ServiceBookingModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        service={service}
        selectedPlan={selectedPlanForModal}
      />
    </main>
  );
}
