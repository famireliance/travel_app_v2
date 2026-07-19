'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Sparkles, Shield, Droplets, Flame, Moon, Lock, CheckCircle2, ChevronRight, Info, Award, Heart, BookOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTravel } from '@/context/TravelContext';
import { COMPANION_CHARACTERS, CompanionId } from '@/lib/companion';
import { getPlayerLevelInfo } from '@/lib/gamification';
import { FAIRIES_MASTER } from '@/lib/fairies';

type ViewMode = 'COMPANION' | 'FAIRIES';

export default function CompanionPage() {
  const router = useRouter();
  const { totalXP, selectedCompanionId, updateCompanionId, companionChar, companionStage, collectedFairies, collectedFairyDates } = useTravel();
  const playerLvInfo = getPlayerLevelInfo(totalXP);
  
  const [viewMode, setViewMode] = useState<ViewMode>('COMPANION');
  const [activeTab, setActiveTab] = useState<CompanionId>(selectedCompanionId);
  const activeViewChar = COMPANION_CHARACTERS[activeTab];

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-white">
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -right-1/4 w-[1000px] h-[1000px] rounded-full bg-blue-900/20 blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute top-1/3 -left-1/4 w-[800px] h-[800px] rounded-full bg-indigo-900/20 blur-[100px] mix-blend-screen animate-pulse" style={{ animationDuration: '12s' }} />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 p-6 lg:px-12 flex flex-col md:flex-row items-center justify-between border-b border-white/10 bg-slate-950/50 backdrop-blur-md gap-4">
        <div className="flex items-center w-full md:w-auto justify-between md:justify-start gap-4">
          <button 
            onClick={() => router.back()} 
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </button>
          <div className="flex items-center gap-2">
            <Sparkles className="text-amber-400 w-5 h-5" />
            <span className="font-bold tracking-widest uppercase text-sm">CHARACTER ENCYCLOPEDIA</span>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex p-1 bg-white/5 rounded-full border border-white/10">
          <button 
            onClick={() => setViewMode('COMPANION')}
            className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${viewMode === 'COMPANION' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            相棒精霊
          </button>
          <button 
            onClick={() => setViewMode('FAIRIES')}
            className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${viewMode === 'FAIRIES' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            ご当地妖精図鑑
          </button>
        </div>
      </header>

      <main className="relative z-10 pb-32">
        {viewMode === 'COMPANION' ? (
          <>
            {/* Hero Section (Companion) */}
            <div className="px-6 lg:px-12 pt-12 pb-16 lg:pt-20 lg:pb-24 border-b border-white/10">
              <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-24">
                {/* Left: Current Status */}
                <div className="flex-1 space-y-8">
                  <div>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                      <span className="inline-block px-4 py-1.5 rounded-full bg-blue-500/20 text-blue-300 font-bold text-xs tracking-widest border border-blue-500/30 mb-6">
                        現在同行中の守護精霊
                      </span>
                      <h1 className="text-4xl lg:text-6xl font-serif font-bold leading-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-indigo-200">
                        {companionStage.name}
                      </h1>
                      <p className="text-slate-400 text-sm lg:text-base max-w-xl leading-relaxed">
                        あなたが島を訪れ経験を積むことで、パートナーである守護精霊も共に成長し、新たな能力（スキル）を開花させます。現在のレベルに応じて特別な姿へと進化を遂げます。
                      </p>
                    </motion.div>
                  </div>

                  <motion.div 
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
                    className="bg-white/5 border border-white/10 rounded-3xl p-6 lg:p-8 backdrop-blur-sm"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="font-bold text-sm text-slate-300 flex items-center gap-2">
                        <Award className="w-4 h-4 text-amber-400" />
                        旅人 {playerLvInfo.title}
                      </div>
                      <div className="font-bold text-sm text-white bg-blue-600/30 px-3 py-1 rounded-full border border-blue-500/50">
                        Lv.{playerLvInfo.level}
                      </div>
                    </div>
                    
                    <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden mb-3">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-400 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                        style={{ width: `${Math.min(100, (totalXP / (playerLvInfo.level * 100)) * 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>累計XP: {totalXP}</span>
                      <span>次のレベル・進化まで あと少し</span>
                    </div>
                  </motion.div>
                </div>

                {/* Right: Big Avatar */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, type: 'spring' }}
                  className="w-full max-w-md shrink-0 relative"
                >
                  <div className="absolute inset-0 bg-blue-500/20 blur-[80px] rounded-full" />
                  <div className={`w-full aspect-square rounded-[3rem] bg-gradient-to-br ${companionStage.badgeGradient} flex items-center justify-center text-[120px] shadow-2xl border-4 border-white/20 relative z-10`}>
                    {companionStage.icon}
                  </div>
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 border border-white/20 px-6 py-3 rounded-2xl shadow-xl z-20 flex items-center gap-3 w-max">
                    <Shield className="w-5 h-5 text-amber-400" />
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold">発動中のスキル</div>
                      <div className="text-sm font-bold text-white">{companionStage.skillName}</div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Encyclopedia (Companion) */}
            <div className="px-6 lg:px-12 pt-20 max-w-7xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-serif font-bold mb-4">守護精霊 大図鑑</h2>
                <p className="text-slate-400 text-sm max-w-2xl mx-auto">旅の目的に合わせて、いつでも同行するパートナーを切り替えることができます。レベルアップによってすべての精霊が同時に強くなっていきます。</p>
              </div>
              <div className="flex overflow-x-auto hide-scrollbar gap-4 justify-start lg:justify-center mb-12 px-4 snap-x">
                {(Object.keys(COMPANION_CHARACTERS) as CompanionId[]).map(cid => {
                  const char = COMPANION_CHARACTERS[cid];
                  const isActive = activeTab === cid;
                  const isSelected = selectedCompanionId === cid;
                  return (
                    <button
                      key={cid}
                      onClick={() => setActiveTab(cid)}
                      className={`flex items-center gap-3 px-6 py-4 rounded-2xl border-2 transition-all shrink-0 snap-start ${
                        isActive ? 'border-blue-500 bg-blue-900/30 shadow-[0_0_20px_rgba(59,130,246,0.2)]' : 'border-white/10 bg-white/5 hover:bg-white/10 text-slate-400'
                      }`}
                    >
                      <div className="text-2xl">{char.stages[0].icon}</div>
                      <div className="text-left">
                        <div className="text-xs font-bold tracking-widest">{char.name}</div>
                        <div className={`text-[10px] mt-0.5 ${isActive ? 'text-blue-300' : 'text-slate-500'}`}>{char.theme}</div>
                      </div>
                      {isSelected && (
                        <div className="ml-2 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                      )}
                    </button>
                  )
                })}
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}
                  className="bg-white/5 border border-white/10 rounded-[3rem] p-8 lg:p-16 backdrop-blur-sm"
                >
                  <div className="flex flex-col lg:flex-row gap-12 lg:gap-24 mb-16">
                    <div className="flex-1">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-slate-300 font-bold text-xs tracking-widest mb-4">
                        <Heart className="w-3 h-3 text-pink-400" /> {activeViewChar.categoryTag}
                      </div>
                      <h3 className="text-3xl font-serif font-bold mb-4">{activeViewChar.name}</h3>
                      <p className="text-slate-300 leading-relaxed text-sm lg:text-base">
                        {activeViewChar.description}
                      </p>
                      {selectedCompanionId !== activeTab && (
                        <button 
                          onClick={() => updateCompanionId(activeTab)}
                          className="mt-8 bg-white text-slate-900 hover:bg-slate-200 px-8 py-3 rounded-full font-bold transition-colors shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                        >
                          この精霊を同行パートナーに選ぶ
                        </button>
                      )}
                      {selectedCompanionId === activeTab && (
                        <div className="mt-8 inline-flex items-center gap-2 text-emerald-400 font-bold px-6 py-3 rounded-full bg-emerald-900/30 border border-emerald-500/30">
                          <CheckCircle2 className="w-5 h-5" /> 現在同行中です
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xl font-serif font-bold mb-8 flex items-center gap-3">
                      <Sparkles className="text-amber-400" /> 進化系統樹・獲得スキル
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                      {activeViewChar.stages.map((st, idx) => {
                        const isUnlocked = playerLvInfo.level >= st.minLevel;
                        return (
                          <div 
                            key={st.stage} 
                            className={`relative rounded-3xl p-6 border ${
                              isUnlocked ? 'bg-gradient-to-b from-white/10 to-white/5 border-white/20' : 'bg-white/5 border-white/5 opacity-50 grayscale'
                            }`}
                          >
                            <div className="flex justify-between items-start mb-6">
                              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full tracking-widest ${isUnlocked ? 'bg-blue-500/20 text-blue-300' : 'bg-white/10 text-white/40'}`}>
                                STAGE {st.stage}
                              </span>
                              {!isUnlocked ? (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-white/50 bg-white/10 px-2 py-1 rounded">
                                  <Lock className="w-3 h-3" /> Lv.{st.minLevel}〜
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-emerald-400">UNLOCKED</span>
                              )}
                            </div>
                            <div className={`w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br ${st.badgeGradient} flex items-center justify-center text-4xl shadow-lg border border-white/30 mb-6`}>
                              {st.icon}
                            </div>
                            <div className="text-center mb-6">
                              <h5 className="font-bold text-lg mb-1">{st.name}</h5>
                              <p className="text-xs text-slate-400">{st.title}</p>
                            </div>
                            <div className="bg-black/30 rounded-xl p-4 border border-white/5">
                              <div className="text-[10px] font-bold text-blue-300 mb-1 flex items-center gap-1">
                                <Flame className="w-3 h-3" /> スキル: {st.skillName}
                              </div>
                              <p className="text-xs text-slate-300 leading-relaxed">
                                {st.skillDesc}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="px-6 lg:px-12 pt-12 max-w-7xl mx-auto"
          >
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-serif font-bold mb-4 flex items-center justify-center gap-4">
                <BookOpen className="text-indigo-400" /> ご当地妖精ずかん
              </h2>
              <p className="text-slate-400 text-sm max-w-2xl mx-auto leading-relaxed">
                島を巡ってチェックインすると、その土地に棲む可愛らしいご当地妖精がコレクションされます。<br/>
                企業コラボの超激レア妖精も隠れているかも…？全国を飛び回ってコレクションをコンプリートしよう！
              </p>
              <div className="mt-6 inline-flex items-center gap-2 bg-indigo-900/30 border border-indigo-500/30 px-6 py-2 rounded-full text-indigo-300 font-bold text-sm">
                収集率: {collectedFairies.length} / {FAIRIES_MASTER.length}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8">
              {FAIRIES_MASTER.map(fairy => {
                const isDiscovered = collectedFairies.includes(fairy.id);
                const isRareOrEpic = fairy.rarity === 'RARE' || fairy.rarity === 'EPIC' || fairy.rarity === 'SPOT_EXCLUSIVE';

                return (
                  <div key={fairy.id} className="relative group">
                    <div className={`w-full aspect-[2/3] rounded-3xl p-[2px] transition-all duration-500 ${
                      isDiscovered 
                        ? (isRareOrEpic ? 'bg-gradient-to-br from-amber-200 via-white to-amber-500 shadow-[0_0_30px_rgba(251,191,36,0.3)] hover:-translate-y-2' : 'bg-white/20 shadow-lg hover:-translate-y-2')
                        : 'bg-white/5 border border-white/5'
                    }`}>
                      <div className={`w-full h-full rounded-[22px] flex flex-col justify-between overflow-hidden relative ${
                        isDiscovered ? `bg-gradient-to-br ${fairy.visual.colorFrom} ${fairy.visual.colorTo}` : 'bg-slate-900'
                      }`}>
                        
                        {/* Holographic overlay */}
                        {isDiscovered && isRareOrEpic && (
                          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay group-hover:bg-[length:120%_120%] group-hover:opacity-40 transition-all duration-700" />
                        )}

                        <div className="p-4 relative z-10 flex justify-between items-start">
                          <div className={`px-2 py-1 rounded-md text-[8px] font-bold tracking-widest ${
                            isDiscovered 
                              ? (fairy.rarity === 'EPIC' ? 'bg-purple-500/80 text-white' :
                                fairy.rarity === 'SPOT_EXCLUSIVE' ? 'bg-amber-500/80 text-white' :
                                fairy.rarity === 'RARE' ? 'bg-blue-500/80 text-white' : 'bg-slate-900/50 text-white')
                              : 'bg-slate-800 text-slate-500'
                          }`}>
                            {fairy.rarity}
                          </div>
                        </div>

                        <div className="flex-1 flex items-center justify-center relative z-10 my-4">
                          {isDiscovered ? (
                            <div className={`relative filter drop-shadow-xl ${fairy.visual.shadowColor} group-hover:scale-110 transition-transform duration-500`}>
                              {fairy.visual.imageUrl ? (
                                <img src={fairy.visual.imageUrl} alt={fairy.name} className="w-32 h-32 object-contain" />
                              ) : (
                                <span className="text-[80px] lg:text-[100px]">{fairy.visual.icon}</span>
                              )}
                            </div>
                          ) : (
                            <div className="relative filter blur-sm brightness-0 opacity-20 group-hover:blur-md transition-all">
                              {fairy.visual.imageUrl ? (
                                <img src={fairy.visual.imageUrl} alt="???" className="w-32 h-32 object-contain" />
                              ) : (
                                <span className="text-[80px] lg:text-[100px]">{fairy.visual.icon}</span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className={`p-4 relative z-10 text-center backdrop-blur-sm border-t ${isDiscovered ? 'bg-black/30 border-white/10' : 'bg-black/60 border-transparent'}`}>
                          {isDiscovered ? (
                            <>
                              <h4 className="text-base font-bold text-white mb-1 leading-tight">{fairy.name}</h4>
                              <p className="text-[9px] text-white/70">{fairy.theme}</p>
                              {fairy.collabSponsor && (
                                <p className="text-[8px] text-amber-300 font-bold mt-2 truncate">SPONSOR: {fairy.collabSponsor}</p>
                              )}
                              {collectedFairyDates[fairy.id] && (
                                <div className="mt-2 pt-2 border-t border-white/10 text-left">
                                  <p className="text-[8px] text-white/50 font-mono scale-90 origin-left">
                                    {new Date(collectedFairyDates[fairy.id]).toLocaleString('ja-JP', {year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'})}
                                  </p>
                                  <p className="text-[8px] text-white/50 font-mono scale-90 origin-left truncate">
                                    LOC: {fairy.island_id.toUpperCase()}
                                  </p>
                                </div>
                              )}
                            </>
                          ) : (
                            <>
                              <h4 className="text-sm font-bold text-slate-600 mb-1">???</h4>
                              <p className="text-[9px] text-slate-700">条件を満たして発見</p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
