'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Award, Bot, Shield, Check, ChevronRight, Lock, Heart, Droplets, Flame, Moon, BookOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTravel } from '@/context/TravelContext';
import { COMPANION_CHARACTERS, CompanionId } from '@/lib/companion';
import { getPlayerLevelInfo } from '@/lib/gamification';

interface CompanionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CompanionModal({ isOpen, onClose }: CompanionModalProps) {
  const router = useRouter();
  const { totalXP, selectedCompanionId, updateCompanionId, companionChar, companionStage } = useTravel();
  const playerLvInfo = getPlayerLevelInfo(totalXP);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-100 overflow-hidden my-8 max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 p-6 lg:p-8 text-white relative flex-shrink-0">
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs tracking-widest uppercase mb-2">
              <Bot className="w-4 h-4" />
              <span>ISLAND SPIRIT COMPANIONS</span>
            </div>
            <h2 className="text-2xl lg:text-3xl font-serif font-bold tracking-wider flex items-center gap-3">
              <span>オリジナル進化キャラクター＆島旅精霊</span>
            </h2>
            <p className="text-xs text-blue-200/80 mt-2 max-w-2xl leading-relaxed">
              あなたの旅路に寄り添い、共に成長・進化する「島旅の守護精霊」たち。島を巡って経験値(XP)を獲得すると、さらに強大な姿とスキルが開放されます！デジタル踏破証明書や公式カードにも印字可能です。
            </p>
          </div>

          {/* Current Status Banner */}
          <div className="bg-slate-50 border-b border-slate-200/80 px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 flex-shrink-0">
            <div className="flex items-center gap-4">
              <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${companionStage.badgeGradient} flex items-center justify-center text-5xl shadow-md border-2 border-white shrink-0`}>
                {companionStage.icon}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[0.65rem] border border-blue-200">
                    現在選択中のパートナー
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    旅人 {playerLvInfo.title} (Lv.{playerLvInfo.level})
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-lg sm:text-xl mt-0.5 flex items-center gap-2">
                  <span>{companionStage.name}</span>
                </h3>
                <p className="text-xs text-slate-600 font-medium mt-0.5">
                  発動中スキル: <span className="text-blue-700 font-bold">[{companionStage.skillName}]</span> {companionStage.skillDesc}
                </p>
              </div>
            </div>
          </div>

          {/* Character Selection & Evolution Grid */}
          <div className="p-6 lg:p-8 overflow-y-auto space-y-8 flex-grow">
            <div>
              <h4 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>パートナー精霊の選択（いつでも切り替え可能）</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(Object.keys(COMPANION_CHARACTERS) as CompanionId[]).map((cid) => {
                  const char = COMPANION_CHARACTERS[cid];
                  const isCurrent = selectedCompanionId === cid;
                  // Get current player stage for this char
                  let activeStage = char.stages[0];
                  for (const st of char.stages) {
                    if (playerLvInfo.level >= st.minLevel) activeStage = st;
                  }

                  return (
                    <div
                      key={cid}
                      onClick={() => updateCompanionId(cid)}
                      className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                        isCurrent
                          ? 'border-blue-600 bg-blue-50/40 shadow-md ring-2 ring-blue-500/10'
                          : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
                      }`}
                    >
                      {isCurrent && (
                        <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-blue-600 text-white font-bold text-[0.65rem] flex items-center gap-1 shadow-sm">
                          <Check className="w-3 h-3" />
                          <span>同行中</span>
                        </div>
                      )}
                      <div>
                        <div className="flex items-start gap-4">
                          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${activeStage.badgeGradient} flex items-center justify-center text-4xl shadow-sm shrink-0 border border-white`}>
                            {activeStage.icon}
                          </div>
                          <div className="pr-16">
                            <span className="text-[0.65rem] font-bold text-blue-600 tracking-wider uppercase block">
                              {char.categoryTag}
                            </span>
                            <h5 className="font-bold text-slate-900 text-base">
                              {char.name}
                            </h5>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                              {char.theme}
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                          {char.description}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700">
                          現在開放段階: <span className="text-blue-700">{activeStage.title}</span>
                        </span>
                        <span className="font-bold text-blue-600 flex items-center gap-0.5">
                          {isCurrent ? '選択中' : 'このパートナーに切り替える'}
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Evolution Tree / Stages for Selected Companion */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/60">
              <h4 className="text-sm font-bold text-slate-800 tracking-widest mb-4 flex items-center justify-between">
                <span>【{companionChar.name}】の進化ツリー図鑑</span>
                <span className="text-xs font-normal text-slate-500">レベル到達で自動進化・強化</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {companionChar.stages.map((st) => {
                  const isUnlocked = playerLvInfo.level >= st.minLevel;
                  const isCurrentStage = companionStage.stage === st.stage;

                  return (
                    <div
                      key={st.stage}
                      className={`p-4 rounded-xl border relative transition-all flex flex-col justify-between ${
                        isCurrentStage
                          ? 'bg-white border-blue-500 shadow-sm ring-2 ring-blue-500/10'
                          : isUnlocked
                          ? 'bg-white/80 border-slate-200'
                          : 'bg-slate-100/70 border-slate-200/60 opacity-60'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-[0.65rem] font-bold px-2 py-0.5 rounded ${
                            isCurrentStage ? 'bg-blue-600 text-white' : isUnlocked ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                          }`}>
                            STAGE {st.stage}
                          </span>
                          {!isUnlocked ? (
                            <span className="text-xs text-slate-400 flex items-center gap-1 font-bold">
                              <Lock className="w-3 h-3" />
                              Lv.{st.minLevel}〜
                            </span>
                          ) : (
                            <span className="text-xs text-emerald-600 font-bold">開放済</span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 my-3">
                          <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${st.badgeGradient} flex items-center justify-center text-3xl shadow-sm border border-white shrink-0`}>
                            {st.icon}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900 leading-tight">
                              {st.name}
                            </p>
                            <p className="text-[0.65rem] text-slate-500 mt-0.5 font-medium">
                              {st.title}
                            </p>
                          </div>
                        </div>

                        <div className="text-xs bg-slate-100/80 rounded-lg p-2.5 mt-2 text-slate-700 border border-slate-200/50">
                          <span className="font-bold text-blue-700 block text-[0.65rem] mb-0.5">
                            スキル: {st.skillName}
                          </span>
                          <span className="text-[0.65rem] leading-snug block">
                            {st.skillDesc}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-slate-50 border-t border-slate-200/80 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 flex-shrink-0">
            <span className="text-xs text-slate-500 flex-1 hidden lg:block">
              💡 離島訪問記録をつけて経験値(XP)を獲得すると、パートナーキャラクターがさらなる段階へ進化します！
            </span>
            <div className="flex gap-3 w-full sm:w-auto">
              <button
                onClick={() => { onClose(); router.push('/companion'); }}
                className="px-4 py-2.5 rounded-xl bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-200 font-bold text-xs transition-all flex items-center justify-center gap-1.5 flex-1 sm:flex-none"
              >
                <BookOpen className="w-3.5 h-3.5" /> 大図鑑を開く
              </button>
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-blue-900 text-white font-bold text-xs transition-all shadow-sm flex-1 sm:flex-none"
              >
                決定して閉じる
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
