'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Award, CheckCircle2, Sparkles } from 'lucide-react';
import { ALL_ISLANDS_MASTER_DICTIONARY } from '@/data/allIslandsMaster';
import { useTravel } from '@/context/TravelContext';

interface ArchipelagoProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ArchipelagoGroup {
  id: string;
  name: string;
  region: string;
  description: string;
  icon: string;
  colorFrom: string;
  colorTo: string;
  islandIds: string[];
}

export default function ArchipelagoProgressModal({ isOpen, onClose }: ArchipelagoProgressModalProps) {
  const { islandStatuses } = useTravel();

  if (!isOpen) return null;

  // Archipelago definition & island grouping
  const allIslands = Object.values(ALL_ISLANDS_MASTER_DICTIONARY).filter(i => i.is_conquest_target !== false);

  const archipelagos: ArchipelagoGroup[] = [
    {
      id: 'yaeyama',
      name: '八重山諸島',
      region: '沖縄県',
      description: '石垣島・竹富島・西表島・波照間島・与那国島など、日本の最南端・最西端を擁する絶景諸島。',
      icon: '🌺',
      colorFrom: 'from-emerald-600',
      colorTo: 'to-teal-800',
      islandIds: ['392', '393', '394', '395', '396', '397', '398', '399', '400'] // Ishigaki, Taketomi, Iriomote, etc.
    },
    {
      id: 'kerama',
      name: '慶良間諸島',
      region: '沖縄県',
      description: '世界中のダイバーが羨む「ケラマブルー」の透明度を誇る国立公園離島群。',
      icon: '🐢',
      colorFrom: 'from-cyan-600',
      colorTo: 'to-blue-800',
      islandIds: ['380', '381', '382', '383', '384', '385'] // Tokashiki, Zamami, Aka, etc.
    },
    {
      id: 'izu',
      name: '伊豆諸島',
      region: '東京都',
      description: '伊豆大島・新島・神津島・三宅島・八丈島・青ヶ島など、東京発高速船で出かける黒潮の島々。',
      icon: '🌋',
      colorFrom: 'from-blue-600',
      colorTo: 'to-indigo-900',
      islandIds: ['10', '11', '12', '13', '14', '15', '16', '17'] // Oshima, Niijima, Hachijojima, etc.
    },
    {
      id: 'ogasawara',
      name: '小笠原諸島',
      region: '東京都',
      description: '世界自然遺産。片道24時間の航路を越えた先にある東洋のガラパゴス（父島・母島）。',
      icon: '🐋',
      colorFrom: 'from-amber-600',
      colorTo: 'to-orange-900',
      islandIds: ['18', '19'] // Chichijima, Hahajima
    },
    {
      id: 'oki',
      name: '隠岐諸島',
      region: '島根県',
      description: 'ユネスコ世界ジオパーク。島前・島後からなる壮大な断崖絶壁と歴史の島。',
      icon: '🪨',
      colorFrom: 'from-purple-600',
      colorTo: 'to-slate-900',
      islandIds: ['200', '201', '202', '203'] // Dogo, Nishinoshima, Nakanoshima, Chiburijima
    },
    {
      id: 'goto',
      name: '五島列島',
      region: '長崎県',
      description: '世界遺産潜伏キリシタン関連遺産と教会群、雄大な西海国立公園の島々。',
      icon: '⛪',
      colorFrom: 'from-sky-600',
      colorTo: 'to-indigo-800',
      islandIds: ['300', '301', '302', '303', '304'] // Fukue, Nakadori, Wakamatsu, Ojika, etc.
    },
    {
      id: 'tokara',
      name: 'トカラ列島（十島村）',
      region: '鹿児島県',
      description: '南北160kmに渡る秘境絶海孤島。秘湯と野生馬が息づく日本最後の秘境。',
      icon: '🐎',
      colorFrom: 'from-rose-600',
      colorTo: 'to-red-950',
      islandIds: ['350', '351', '352', '353', '354', '355', '356'] // Kuchinoshima, Nakanoshima, Suwanosejima, Akusekijima, etc.
    },
    {
      id: 'setouchi',
      name: '瀬戸内アート諸島',
      region: '香川県・岡山県',
      description: '直島・豊島・男木島・女木島・小豆島。現代アートと穏やかな瀬戸内海が調和する島々。',
      icon: '🎨',
      colorFrom: 'from-yellow-600',
      colorTo: 'to-amber-800',
      islandIds: ['195', '196', '197', '198', '199'] // Naoshima, Teshima, Ogijima, Megijima, Shodoshima
    }
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 lg:p-8" onClick={onClose}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }} 
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative z-10 w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-700/60 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Award size={22} />
              </div>
              <div>
                <h2 className="font-serif font-bold text-xl text-white flex items-center gap-2">
                  全国諸島・エリア別 制覇進捗図鑑
                </h2>
                <p className="text-xs text-slate-400">ARCHIPELAGO CONQUEST PROGRESS & GOLD BADGES</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {archipelagos.map(group => {
                // Count how many islands in this group are visited
                let totalInGroup = group.islandIds.length;
                let visitedInGroup = 0;
                
                group.islandIds.forEach(id => {
                  if (islandStatuses[id] === 'visited' || islandStatuses[id] === 'verified_visited') {
                    visitedInGroup++;
                  }
                });

                // Check fallback by matching islands if explicit IDs don't cover all
                if (totalInGroup === 0) {
                  const matched = allIslands.filter(i => String(i.region_id) === group.id);
                  totalInGroup = matched.length || 5;
                  visitedInGroup = matched.filter(i => islandStatuses[i.id] === 'visited' || islandStatuses[i.id] === 'verified_visited').length;
                }

                const percent = Math.round((visitedInGroup / Math.max(totalInGroup, 1)) * 100);
                const isGoldComplete = percent >= 100;

                return (
                  <div key={group.id} className={`p-5 rounded-2xl border transition-all ${
                    isGoldComplete 
                      ? 'bg-gradient-to-br from-amber-500/20 via-slate-800 to-amber-900/30 border-amber-500/60 shadow-lg shadow-amber-500/10' 
                      : 'bg-slate-800/60 border-slate-700/60'
                  }`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{group.icon}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-serif font-bold text-white text-base">{group.name}</h3>
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-700">{group.region}</span>
                          </div>
                          <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{group.description}</p>
                        </div>
                      </div>
                      
                      {isGoldComplete && (
                        <div className="shrink-0 flex items-center gap-1 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-extrabold text-[10px] px-2.5 py-1 rounded-full shadow-md animate-pulse">
                          <Sparkles size={12} /> GOLD COMPLETE
                        </div>
                      )}
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5 mt-4">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-300 flex items-center gap-1">
                          <CheckCircle2 size={14} className={isGoldComplete ? 'text-amber-400' : 'text-slate-500'} />
                          到達数: <span className="text-white font-mono">{visitedInGroup}</span> / {totalInGroup} 島
                        </span>
                        <span className={`font-mono text-sm ${isGoldComplete ? 'text-amber-400 font-extrabold' : 'text-slate-300'}`}>
                          {percent}%
                        </span>
                      </div>

                      <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
                        <div 
                          style={{ width: `${percent}%` }}
                          className={`h-full rounded-full transition-all duration-700 ${
                            isGoldComplete 
                              ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 shadow-[0_0_10px_rgba(251,191,36,0.6)]' 
                              : 'bg-gradient-to-r from-blue-500 to-emerald-400'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
