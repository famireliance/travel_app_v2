'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { calculateIslandXP, getPlayerLevelInfo } from '@/lib/gamification';
import { CompanionId, CompanionStageInfo, CompanionCharacter, COMPANION_CHARACTERS, getCompanionStageInfo } from '@/lib/companion';
import { IslandFairy, FAIRIES_MASTER } from '@/lib/fairies';
import { COLLAB_SPOTS } from '@/lib/spots';
import { ALL_ISLANDS_MASTER_DICTIONARY } from '@/data/allIslandsMaster';

export type IslandStatus = 'visited' | 'planning' | 'none' | 'verified_visited';

interface TravelContextType {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user: any | null;
  islandStatuses: Record<string, IslandStatus>;
  updateStatus: (islandId: string, status: IslandStatus) => void;
  decrementVisitCount: (islandId: string) => Promise<void>;
  totalVisited: number;
  travelerName: string;
  updateTravelerName: (name: string) => void;
  bio: string;
  updateBio: (bio: string) => void;
  // Gamification (XP & Mastery)
  visitCounts: Record<string, number>;
  spotsVisited: Record<string, number>;
  totalXP: number;
  totalPoints: number;
  conquestTargetCount: number;
  // Companion Character
  selectedCompanionId: CompanionId;
  updateCompanionId: (id: CompanionId) => void;
  companionChar: CompanionCharacter;
  companionStage: CompanionStageInfo;
  // Island Fairies Collection
  collectedFairies: string[];
  collectedFairyDates: Record<string, string>; // { fairyId: '2026-07-19T12:00:00Z' }
  newlyDiscoveredFairies: IslandFairy[];
  clearDiscoveredFairy: (fairyId: string) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addIslandVisit: (islandId: string, islandObj?: any, newSpots?: number, isVerified?: boolean) => { xpGained: number; error?: string };
  addSpotVisit: (spotId: string) => boolean;
  lastVisitDates: Record<string, string>;
  // For passthrough from CheckInModal to CertificateModal
  tempCheckInPhotoUrl: string | null;
  setTempCheckInPhotoUrl: (url: string | null) => void;
  tempCheckInDate: string | null;
  setTempCheckInDate: (date: string | null) => void;
}

const TravelContext = createContext<TravelContextType>({
  user: null,
  islandStatuses: {},
  updateStatus: async () => {},
  decrementVisitCount: async () => {},
  totalVisited: 0,
  travelerName: '島旅トラベラー',
  updateTravelerName: () => {},
  bio: '',
  updateBio: () => {},
  visitCounts: {},
  spotsVisited: {},
  totalXP: 0,
  totalPoints: 0,
  conquestTargetCount: 425, // default
  selectedCompanionId: 'shimamaru',
  updateCompanionId: () => {},
  companionChar: COMPANION_CHARACTERS.shimamaru,
  companionStage: COMPANION_CHARACTERS.shimamaru.stages[0],
  collectedFairies: [],
  collectedFairyDates: {},
  newlyDiscoveredFairies: [],
  clearDiscoveredFairy: () => {},
  addIslandVisit: () => ({ xpGained: 0 }),
  addSpotVisit: () => false,
  lastVisitDates: {},
  tempCheckInPhotoUrl: null,
  setTempCheckInPhotoUrl: () => {},
  tempCheckInDate: null,
  setTempCheckInDate: () => {}
});

export function TravelProvider({ children }: { children: React.ReactNode }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any>(null);
  const [islandStatuses, setIslandStatuses] = useState<Record<string, IslandStatus>>({});
  const [travelerName, setTravelerName] = useState<string>('島旅トラベラー');
  const [bio, setBio] = useState<string>('');
  const [visitCounts, setVisitCounts] = useState<Record<string, number>>({});
  const [spotsVisited, setSpotsVisited] = useState<Record<string, number>>({});
  const [totalXP, setTotalXP] = useState<number>(0);
  const [selectedCompanionId, setSelectedCompanionId] = useState<CompanionId>('shimamaru');
  const [collectedFairies, setCollectedFairies] = useState<string[]>([]);
  const [collectedFairyDates, setCollectedFairyDates] = useState<Record<string, string>>({});
  const [newlyDiscoveredFairies, setNewlyDiscoveredFairies] = useState<IslandFairy[]>([]);
  const [lastVisitDates, setLastVisitDates] = useState<Record<string, string>>({});
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [tempCheckInPhotoUrl, setTempCheckInPhotoUrl] = useState<string | null>(null);
  const [tempCheckInDate, setTempCheckInDate] = useState<string | null>(null);

  // Auth & Data Load
  useEffect(() => {
    let isMounted = true;
    const savedName = localStorage.getItem('kiratabi_traveler_name');
    if (savedName && isMounted) setTravelerName(savedName);

    const savedXP = localStorage.getItem('kiratabi_total_xp');
    if (savedXP && isMounted) setTotalXP(Number(savedXP) || 0);

    const savedComp = localStorage.getItem('kiratabi_companion_id') as CompanionId;
    if (savedComp && COMPANION_CHARACTERS[savedComp] && isMounted) {
      setSelectedCompanionId(savedComp);
    }

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!isMounted) return;
      const currentUser = session?.user || null;
      setUser(currentUser);
      
      // ユーザーのニックネームをSupabaseから取得
      if (currentUser) {
        try {
          const { data, error } = await supabase.from('user_profiles').select('nickname').eq('id', currentUser.id).single();
          if (data && data.nickname && isMounted) {
            setTravelerName(data.nickname);
            localStorage.setItem('kiratabi_traveler_name', data.nickname);
          }
        } catch(e) {}
        
        if (currentUser.user_metadata?.bio) {
          setBio(currentUser.user_metadata.bio);
        }
      }

      loadLocalData(currentUser?.id, isMounted);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      if (_event === 'SIGNED_OUT') {
        // ユーザーデータをクリアしてゲスト状態に戻す
        setIslandStatuses({});
        setVisitCounts({});
        setSpotsVisited({});
        setCollectedFairies([]);
        setCollectedFairyDates({});
        setLastVisitDates({});
        setIsDataLoaded(false);
      }
      const currentUser = session?.user || null;
      setUser(currentUser);
      
      if (currentUser && _event === 'SIGNED_IN') {
        try {
          supabase.from('user_profiles').select('nickname').eq('id', currentUser.id).single().then(({data}) => {
             if (data && data.nickname && isMounted) {
               setTravelerName(data.nickname);
               localStorage.setItem('kiratabi_traveler_name', data.nickname);
             }
          });
          if (currentUser.user_metadata?.bio) {
            setBio(currentUser.user_metadata.bio);
          }
        } catch(e) {}
      }

      loadLocalData(currentUser?.id, isMounted);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    // データがロードされる前に空の状態でlocalStorageを上書きしてしまうのを防ぐ
    if (!isDataLoaded) return;

    if (user) {
      localStorage.setItem(`travel_app_statuses_${user.id}`, JSON.stringify(islandStatuses));
    } else {
      localStorage.setItem('travel_app_statuses_guest', JSON.stringify(islandStatuses));
    }
  }, [islandStatuses, user, isDataLoaded]);

  const loadLocalData = async (userId?: string, isMounted: boolean = true) => {
    if (!isMounted) return;
    
    // 1. まずゲスト用のデータを取得する（マージ用）
    let guestData: Record<string, IslandStatus> = {};
    const guestStored = localStorage.getItem('travel_app_statuses_guest') || localStorage.getItem('island_status_anon');
    if (guestStored) {
      try {
        const parsed = JSON.parse(guestStored);
        if (typeof parsed === 'object' && parsed !== null) guestData = parsed;
      } catch (e) {}
    }

    // 2. ユーザーデータまたはゲストデータをベースにローカルデータを構築
    let localData: Record<string, IslandStatus> = { ...guestData };
    const storageKey = userId ? `travel_app_statuses_${userId}` : 'travel_app_statuses_guest';
    const oldKey = userId ? `island_status_${userId}` : 'island_status_anon';
    
    if (userId) {
      const userStored = localStorage.getItem(storageKey) || localStorage.getItem(oldKey);
      if (userStored) {
        try {
          const parsed = JSON.parse(userStored);
          if (typeof parsed === 'object' && parsed !== null) {
            // ユーザーデータが存在すれば、ゲストデータを上書きマージ
            localData = { ...localData, ...parsed };
          }
        } catch (e) {}
      }
    }
    
    if (isMounted) setIslandStatuses(localData);

    // 訪問回数のマージ
    let vLocal: Record<string, number> = {};
    const guestVStored = localStorage.getItem('island_visits_count_anon');
    if (guestVStored) { try { const p = JSON.parse(guestVStored); if(p) vLocal = {...p}; } catch(e){} }
    const vKey = userId ? `island_visits_count_${userId}` : 'island_visits_count_anon';
    if (userId) {
       const userVStored = localStorage.getItem(vKey);
       if (userVStored) { try { const p = JSON.parse(userVStored); if(p) vLocal = {...vLocal, ...p}; } catch(e){} }
    }
    // データが無ければステータスから最低1回を付与
    if (Object.keys(vLocal).length === 0) {
      Object.keys(localData).forEach(id => {
        if (localData[id] === 'visited' || localData[id] === 'verified_visited') vLocal[id] = 1;
      });
    }
    if (isMounted) setVisitCounts(vLocal);

    // 最終訪問日のマージ
    let lvLocal: Record<string, string> = {};
    const guestLVStored = localStorage.getItem('island_last_visit_dates_anon');
    if (guestLVStored) { try { const p = JSON.parse(guestLVStored); if(p) lvLocal = {...p}; } catch(e){} }
    const lvKey = userId ? `island_last_visit_dates_${userId}` : 'island_last_visit_dates_anon';
    if (userId) {
       const userLVStored = localStorage.getItem(lvKey);
       if (userLVStored) { try { const p = JSON.parse(userLVStored); if(p) lvLocal = {...lvLocal, ...p}; } catch(e){} }
    }
    if (isMounted) setLastVisitDates(lvLocal);

    // スポットの復元とマージ
    let sLocal: Record<string, number> = {};
    const guestSStored = localStorage.getItem('island_spots_anon');
    if (guestSStored) { try { const p = JSON.parse(guestSStored); if(p) sLocal = {...p}; } catch(e){} }
    const sKey = userId ? `island_spots_${userId}` : 'island_spots_anon';
    if (userId) {
       const userSStored = localStorage.getItem(sKey);
       if (userSStored) { try { const p = JSON.parse(userSStored); if(p) sLocal = {...sLocal, ...p}; } catch(e){} }
    }
    if (isMounted) setSpotsVisited(sLocal);

    // 妖精の復元とマージ
    let fLocal: string[] = [];
    const guestFStored = localStorage.getItem('island_fairies_anon');
    if (guestFStored) { try { const p = JSON.parse(guestFStored); if(Array.isArray(p)) fLocal = [...p]; } catch(e){} }
    const fKey = userId ? `island_fairies_${userId}` : 'island_fairies_anon';
    if (userId) {
       const userFStored = localStorage.getItem(fKey);
       if (userFStored) {
          try { const p = JSON.parse(userFStored); if(Array.isArray(p)) fLocal = Array.from(new Set([...fLocal, ...p])); } catch(e){}
       }
    }
    if (isMounted) setCollectedFairies(fLocal);
    
    // 妖精日付の復元とマージ
    let dLocal: Record<string, string> = {};
    const guestDStored = localStorage.getItem('island_fairies_dates_anon');
    if (guestDStored) { try { const p = JSON.parse(guestDStored); if(p) dLocal = {...p}; } catch(e){} }
    const dKey = userId ? `island_fairies_dates_${userId}` : 'island_fairies_dates_anon';
    if (userId) {
       const userDStored = localStorage.getItem(dKey);
       if (userDStored) { try { const p = JSON.parse(userDStored); if(p) dLocal = {...dLocal, ...p}; } catch(e){} }
    }
    if (isMounted) setCollectedFairyDates(dLocal);

    // Supabaseからの同期・アップロード
    if (userId && isMounted) {
      try {
        const { data, error } = await supabase
          .from('island_visits')
          .select('island_id, status')
          .eq('user_id', userId);

        if (!isMounted) return;

        if (!error && data) {
          const merged: Record<string, IslandStatus> = { ...localData };
          
          // Supabaseのデータをローカルに反映
          data.forEach(row => {
            merged[row.island_id] = row.status as IslandStatus;
          });
          
          // ローカルにはあるがSupabaseにない（ゲスト時代に登録された）データをSupabaseへ保存
          const islandsToUpload = Object.keys(localData).filter(
            id => !data.some(row => row.island_id === id)
          );
          
          if (islandsToUpload.length > 0) {
            for (const islandId of islandsToUpload) {
               const status = localData[islandId];
               if (status !== 'none') {
                  await supabase
                    .from('island_visits')
                    .upsert({
                      user_id: userId,
                      island_id: islandId,
                      status,
                      visited_at: status === 'visited' || status === 'verified_visited' ? new Date().toISOString() : null,
                    }, { onConflict: 'user_id,island_id' });
               }
            }
          }

          setIslandStatuses(merged);
          localStorage.setItem(storageKey, JSON.stringify(merged));
          
          // 全て保存が完了したらゲストデータをクリアする（任意）
          // localStorage.removeItem('travel_app_statuses_guest');
        }
      } catch (err) {
        console.error('Supabase sync error:', err);
      }
    }
    
    if (isMounted) {
      setIsDataLoaded(true);
    }
  };

  const updateStatus = async (islandId: string, status: IslandStatus) => {
    setIslandStatuses(prev => {
      const next = { ...prev };
      if (status === 'none') {
        delete next[islandId];
      } else {
        next[islandId] = status;
      }
      return next;
    });

    if (status === 'visited') {
      // 自動で初回訪問または訪問1回目を記録
      setVisitCounts(prev => {
        const currentCount = prev[islandId] || 0;
        if (currentCount === 0) {
          const nextV = { ...prev, [islandId]: 1 };
          const vKey = user ? `island_visits_count_${user.id}` : 'island_visits_count_anon';
          localStorage.setItem(vKey, JSON.stringify(nextV));
          return nextV;
        }
        return prev;
      });
    }

    // Sync with Supabase if logged in
    if (user) {
      try {
        if (status === 'none') {
          await supabase
            .from('island_visits')
            .delete()
            .eq('user_id', user.id)
            .eq('island_id', islandId);
        } else {
          await supabase
            .from('island_visits')
            .upsert({
              user_id: user.id,
              island_id: islandId,
              status,
              visited_at: status === 'visited' ? new Date().toISOString() : null,
            }, { onConflict: 'user_id,island_id' });
        }
      } catch (err) {
        console.error('Failed to sync updateStatus to Supabase:', err);
      }
    }
  };

  const decrementVisitCount = async (islandId: string) => {
    const currentCount = visitCounts[islandId] || 0;
    if (currentCount <= 1) {
      // If dropping to 0, clear status entirely
      await updateStatus(islandId, 'none');
      setVisitCounts(prev => {
        const nextV = { ...prev };
        delete nextV[islandId];
        const vKey = user ? `island_visits_count_${user.id}` : 'island_visits_count_anon';
        localStorage.setItem(vKey, JSON.stringify(nextV));
        return nextV;
      });
    } else {
      // Just decrement the count
      setVisitCounts(prev => {
        const nextV = { ...prev, [islandId]: currentCount - 1 };
        const vKey = user ? `island_visits_count_${user.id}` : 'island_visits_count_anon';
        localStorage.setItem(vKey, JSON.stringify(nextV));
        return nextV;
      });
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const addIslandVisit = (islandId: string, islandObj?: any, newSpots: number = 0, isVerified: boolean = false) => {
    const todayStr = new Date().toISOString().split('T')[0];
    if (lastVisitDates[islandId] === todayStr) {
      return { xpGained: 0, error: 'already_visited_today' };
    }

    const isFirstVisit = (visitCounts[islandId] || 0) === 0;
    const gained = calculateIslandXP(islandObj || { id: islandId, name: islandId }, isFirstVisit, newSpots);

    // 回数加算
    setVisitCounts(prev => {
      const nextV = { ...prev, [islandId]: (prev[islandId] || 0) + 1 };
      const vKey = user ? `island_visits_count_${user.id}` : 'island_visits_count_anon';
      localStorage.setItem(vKey, JSON.stringify(nextV));
      return nextV;
    });

    // 最終訪問日更新
    setLastVisitDates(prev => {
      const nextLV = { ...prev, [islandId]: todayStr };
      const lvKey = user ? `island_last_visit_dates_${user.id}` : 'island_last_visit_dates_anon';
      localStorage.setItem(lvKey, JSON.stringify(nextLV));
      return nextLV;
    });

    // スポット巡り加算
    if (newSpots > 0) {
      setSpotsVisited(prev => {
        const nextS = { ...prev, [islandId]: (prev[islandId] || 0) + newSpots };
        const sKey = user ? `island_spots_${user.id}` : 'island_spots_anon';
        localStorage.setItem(sKey, JSON.stringify(nextS));
        return nextS;
      });
    }

    // ご当地妖精の発見判定
    if (isFirstVisit && islandObj) {
      const prefectureMap: Record<string, string> = {
        '北海道': 'hokkaido',
        '青森県': 'tohoku', '岩手県': 'tohoku', '秋田県': 'tohoku', '宮城県': 'tohoku', '山形県': 'tohoku', '福島県': 'tohoku',
        '茨城県': 'kanto', '栃木県': 'kanto', '群馬県': 'kanto', '埼玉県': 'kanto', '千葉県': 'kanto', '東京都': 'kanto', '神奈川県': 'kanto',
        '新潟県': 'hokuriku', '富山県': 'hokuriku', '石川県': 'hokuriku', '福井県': 'hokuriku',
        '山梨県': 'tokai', '長野県': 'tokai', '岐阜県': 'tokai', '静岡県': 'tokai', '愛知県': 'tokai', '三重県': 'tokai',
        '滋賀県': 'kinki', '京都府': 'kinki', '大阪府': 'kinki', '兵庫県': 'kinki', '奈良県': 'kinki', '和歌山県': 'kinki',
        '鳥取県': 'chugoku', '島根県': 'chugoku', '岡山県': 'chugoku', '広島県': 'chugoku', '山口県': 'chugoku',
        '徳島県': 'shikoku', '香川県': 'shikoku', '愛媛県': 'shikoku', '高知県': 'shikoku',
        '福岡県': 'kyushu', '佐賀県': 'kyushu', '長崎県': 'kyushu', '熊本県': 'kyushu', '大分県': 'kyushu', '宮崎県': 'kyushu', '鹿児島県': 'kyushu',
      };
      const rId = islandObj.region_id || islandObj.region || prefectureMap[islandObj.prefecture] || 'unknown';
      const iId = islandId;
      
      const foundFairies = FAIRIES_MASTER.filter(f => {
        if (f.island_id && f.island_id === iId) return true; // Island specific (Collab)
        if (!f.island_id && f.region_id === rId) return true; // Region specific
        return false;
      });

      if (foundFairies.length > 0) {
        setCollectedFairies(prev => {
          let hasNew = false;
          const nextF = [...prev];
          const newF: IslandFairy[] = [];
          foundFairies.forEach(f => {
            if (!nextF.includes(f.id)) {
              nextF.push(f.id);
              newF.push(f);
              hasNew = true;
            }
          });

          if (hasNew) {
            const fKey = user ? `island_fairies_${user.id}` : 'island_fairies_anon';
            localStorage.setItem(fKey, JSON.stringify(nextF));
            
            setCollectedFairyDates(prevD => {
              const nextD = { ...prevD };
              newF.forEach(f => { nextD[f.id] = new Date().toISOString(); });
              const dKey = user ? `island_fairies_dates_${user.id}` : 'island_fairies_dates_anon';
              localStorage.setItem(dKey, JSON.stringify(nextD));
              return nextD;
            });

            setNewlyDiscoveredFairies(current => [...current, ...newF]);
            return nextF;
          }
          return prev;
        });
      }
    }

    // XP加算
    if (gained > 0) {
      setTotalXP(prev => {
        const nextXP = prev + gained;
        localStorage.setItem('kiratabi_total_xp', String(nextXP));
        return nextXP;
      });
    }

    // ステータスを同期
    updateStatus(islandId, isVerified ? 'verified_visited' : 'visited');

    return { xpGained: gained };
  };

  const updateTravelerName = async (name: string) => {
    setTravelerName(name);
    localStorage.setItem('kiratabi_traveler_name', name);
    if (user) {
      try {
        await supabase.from('user_profiles').upsert({ id: user.id, nickname: name, email: user.email });
      } catch(e) { console.error('Failed to update nickname in DB', e); }
    }
  };

  const updateBio = async (newBio: string) => {
    setBio(newBio);
    if (user) {
      try {
        await supabase.auth.updateUser({
          data: { bio: newBio }
        });
      } catch (err) {
        console.error('Failed to update bio in auth metadata:', err);
      }
    }
  };

  const updateCompanionId = (id: CompanionId) => {
    setSelectedCompanionId(id);
    localStorage.setItem('kiratabi_companion_id', id);
  };

  const clearDiscoveredFairy = (fairyId: string) => {
    setNewlyDiscoveredFairies(prev => prev.filter(f => f.id !== fairyId));
  };

  const addSpotVisit = (spotId: string): boolean => {
    const spot = COLLAB_SPOTS.find(s => s.id === spotId);
    if (!spot) return false;
    
    const fairyId = spot.reward_fairy_id;
    if (!collectedFairies.includes(fairyId)) {
      const fairy = FAIRIES_MASTER.find(f => f.id === fairyId);
      if (fairy) {
        setCollectedFairies(prev => {
          const next = [...prev, fairyId];
          const fKey = user ? `island_fairies_${user.id}` : 'island_fairies_anon';
          localStorage.setItem(fKey, JSON.stringify(next));
          return next;
        });
        setCollectedFairyDates(prev => {
          const next = { ...prev, [fairyId]: new Date().toISOString() };
          const dKey = user ? `island_fairies_dates_${user.id}` : 'island_fairies_dates_anon';
          localStorage.setItem(dKey, JSON.stringify(next));
          return next;
        });
        setNewlyDiscoveredFairies(prev => [...prev, fairy]);
        return true;
      }
    }
    return false;
  };

  const totalPoints = useMemo(() => {
    let pts = 0;
    Object.entries(islandStatuses).forEach(([id, status]) => {
      if (status === 'verified_visited') {
        const island = ALL_ISLANDS_MASTER_DICTIONARY[id];
        if (island && island.points) {
          pts += island.points;
        }
      }
    });
    return pts;
  }, [islandStatuses]);

  const conquestTargetCount = useMemo(() => {
    return Object.values(ALL_ISLANDS_MASTER_DICTIONARY).filter(i => i.is_conquest_target !== false).length;
  }, []);

  const playerLvInfo = useMemo(() => getPlayerLevelInfo(totalXP), [totalXP]);
  const companionChar = useMemo(() => COMPANION_CHARACTERS[selectedCompanionId] || COMPANION_CHARACTERS.shimamaru, [selectedCompanionId]);
  const companionStage = useMemo(() => getCompanionStageInfo(selectedCompanionId, playerLvInfo.level), [selectedCompanionId, playerLvInfo.level]);

  const totalVisited = useMemo(() => Object.values(islandStatuses).filter(s => s === 'visited' || s === 'verified_visited').length, [islandStatuses]);

  const contextValue = useMemo(() => ({
    user,
    islandStatuses,
    updateStatus,
    decrementVisitCount,
    totalVisited,
    travelerName,
    updateTravelerName,
    bio,
    updateBio,
    visitCounts,
    spotsVisited,
    totalXP,
    totalPoints,
    conquestTargetCount,
    selectedCompanionId,
    updateCompanionId,
    companionChar,
    companionStage,
    collectedFairies,
    collectedFairyDates,
    newlyDiscoveredFairies,
    clearDiscoveredFairy,
    lastVisitDates,
    addIslandVisit,
    addSpotVisit,
    tempCheckInPhotoUrl,
    setTempCheckInPhotoUrl,
    tempCheckInDate,
    setTempCheckInDate
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [user, islandStatuses, totalVisited, travelerName, bio, visitCounts, lastVisitDates, spotsVisited, totalXP, totalPoints, conquestTargetCount, selectedCompanionId, companionChar, companionStage, collectedFairies, collectedFairyDates, newlyDiscoveredFairies, tempCheckInPhotoUrl, tempCheckInDate]);

  return (
    <TravelContext.Provider value={contextValue}>
      {children}
    </TravelContext.Provider>
  );
}

export const useTravel = () => useContext(TravelContext);
