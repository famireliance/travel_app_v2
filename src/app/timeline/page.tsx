'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { ALL_ISLANDS_MASTER_DICTIONARY } from '@/data/allIslandsMaster';
import { MessageCircle, Camera, MapPin, Sparkles, Navigation2 } from 'lucide-react';
import Link from 'next/link';

export default function TimelinePage() {
  const [diaries, setDiaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchTimeline();
  }, []);

  const fetchTimeline = async () => {
    setLoading(true);
    try {
      // Fetch latest 50 diaries globally
      const { data: diariesData, error: diariesError } = await supabase
        .from('island_diaries')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (diariesError) throw diariesError;
      if (!diariesData) return;

      setDiaries(diariesData);

      // Collect unique user_ids to fetch profiles
      const userIds = [...new Set(diariesData.map(d => d.user_id))];
      
      if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('user_profiles')
          .select('id, nickname, avatar_url')
          .in('id', userIds);

        if (!profilesError && profilesData) {
          const profileMap: Record<string, any> = {};
          profilesData.forEach(p => {
            profileMap[p.id] = p;
          });
          setProfiles(profileMap);
        }
      }
    } catch (error) {
      console.error('Timeline fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-32">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col items-center text-center mb-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4"
          >
            <Camera className="w-8 h-8 text-blue-600" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl font-serif font-bold text-slate-800 mb-2"
          >
            みんなの島ノート
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-500 max-w-lg mx-auto text-sm leading-relaxed"
          >
            全国の旅人たちが残した島の記録。リアルタイムで届く各地の島の息吹と絶景をお楽しみください。
          </motion.p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : diaries.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <MessageCircle className="w-16 h-16 mx-auto opacity-20 mb-4" />
            <p className="font-serif">まだ記録がありません。</p>
          </div>
        ) : (
          <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
            <AnimatePresence>
              {diaries.map((diary, index) => {
                const island = ALL_ISLANDS_MASTER_DICTIONARY[diary.island_id];
                const profile = profiles[diary.user_id];
                const hasPhoto = !!diary.photo_url;
                
                return (
                  <motion.div
                    key={diary.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.05, 0.5) }}
                    className="break-inside-avoid bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow group relative"
                  >
                    {hasPhoto && (
                      <div className="relative aspect-[4/5] bg-slate-100 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={diary.photo_url} 
                          alt="Island memory" 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        {/* Island Label Overlay */}
                        <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                          <Link href={`/island/${diary.island_id}`} className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 flex items-center gap-1.5 hover:bg-black/60 transition-colors">
                            <MapPin className="w-3.5 h-3.5 text-amber-400" />
                            <span className="text-xs font-bold text-white shadow-sm">
                              {island ? island.name : 'Unknown Island'}
                            </span>
                          </Link>
                        </div>
                      </div>
                    )}
                    
                    <div className="p-5">
                      {!hasPhoto && island && (
                        <Link href={`/island/${diary.island_id}`} className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold mb-3 hover:bg-blue-100 transition-colors">
                          <Navigation2 className="w-3.5 h-3.5" />
                          {island.name} ({island.prefecture})
                        </Link>
                      )}
                      
                      <p className="text-sm text-slate-700 leading-relaxed font-serif whitespace-pre-wrap mb-4">
                        {diary.content}
                      </p>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-200 to-orange-300 flex items-center justify-center text-amber-800 font-bold text-[10px] uppercase shadow-sm">
                            {profile?.nickname ? profile.nickname.substring(0, 2) : diary.user_id.substring(0, 2)}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-700 leading-none">
                              {profile?.nickname || `User ${diary.user_id.substring(0, 5)}`}
                            </span>
                            {hasPhoto && (
                              <span className="text-[9px] font-bold text-amber-500 flex items-center gap-0.5 mt-0.5">
                                <Sparkles className="w-2.5 h-2.5" /> 認定レポーター
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(diary.created_at).toLocaleDateString('ja-JP')}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
