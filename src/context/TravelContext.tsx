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
  totalVisited: number;
  travelerName: string;
  updateTravelerName: (name: string) => void;
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
  addIslandVisit: (islandId: string, islandObj?: any, newSpots?: number, isVerified?: boolean) => { xpGained: number };
  addSpotVisit: (spotId: string) => boolean;
}

const TravelContext = createContext<TravelContextType>({
  user: null,
  islandStatuses: {},
  updateStatus: () => {},
  totalVisited: 0,
  travelerName: '島旅トラベラー',
  updateTravelerName: () => {},
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
  addSpotVisit: () => false
});

export function TravelProvider({ children }: { children: React.ReactNode }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any>(null);
  const [islandStatuses, setIslandStatuses] = useState<Record<string, IslandStatus>>({});
  const [travelerName, setTravelerName] = useState<string>('島旅トラベラー');
  const [visitCounts, setVisitCounts] = useState<Record<string, number>>({});
  const [spotsVisited, setSpotsVisited] = useState<Record<string, number>>({});
  const [totalXP, setTotalXP] = useState<number>(0);
  const [selectedCompanionId, setSelectedCompanionId] = useState<CompanionId>('shimamaru');
  const [collectedFairies, setCollectedFairies] = useState<string[]>([]);
  const [collectedFairyDates, setCollectedFairyDates] = useState<Record<string, string>>({});
  const [newlyDiscoveredFairies, setNewlyDiscoveredFairies] = useState<IslandFairy[]>([]);

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

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      const currentUser = session?.user || null;
      setUser(currentUser);
      loadLocalData(currentUser?.id, isMounted);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      const currentUser = session?.user || null;
      setUser(currentUser);
      loadLocalData(currentUser?.id, isMounted);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem(`travel_app_statuses_${user.id}`, JSON.stringify(islandStatuses));
    } else {
      localStorage.setItem('travel_app_statuses_guest', JSON.stringify(islandStatuses));
    }
  }, [islandStatuses, user]);

  const loadLocalData = async (userId?: string, isMounted: boolean = true) => {
    if (!isMounted) return;
    const storageKey = userId ? `travel_app_statuses_${userId}` : 'travel_app_statuses_guest';
    const oldKey = userId ? `island_status_${userId}` : 'island_status_anon';
    const stored = localStorage.getItem(storageKey) || localStorage.getItem(oldKey);
    let localData: Record<string, IslandStatus> = {};
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (typeof parsed === 'object' && parsed !== null) {
          localData = parsed;
          if (isMounted) setIslandStatuses(localData);
        } else if (isMounted) {
          setIslandStatuses({});
        }
      } catch (e) {
        console.error("Failed to parse island statuses from localStorage:", e);
        if (isMounted) setIslandStatuses({});
      }
    } else if (isMounted) {
      setIslandStatuses({});
    }

    // 訪問回数とスポットの復元
    const vKey = userId ? `island_visits_count_${userId}` : 'island_visits_count_anon';
    const storedV = localStorage.getItem(vKey);
    if (storedV) {
      try { 
        const parsedV = JSON.parse(storedV);
        if (isMounted && typeof parsedV === 'object' && parsedV !== null) {
          setVisitCounts(parsedV);
        }
      } catch (e) { 
        console.error("Failed to parse visit counts:", e); 
      }
    } else if (isMounted) {
      // 初期化: existing visited statuses get at least count=1
      const initialV: Record<string, number> = {};
      Object.keys(localData).forEach(id => {
        if (localData[id] === 'visited') initialV[id] = 1;
      });
      setVisitCounts(initialV);
    }

    const sKey = userId ? `island_spots_${userId}` : 'island_spots_anon';
    const storedS = localStorage.getItem(sKey);
    if (storedS) {
      try { 
        const parsedS = JSON.parse(storedS);
        if (isMounted && typeof parsedS === 'object' && parsedS !== null) {
          setSpotsVisited(parsedS);
        }
      } catch (e) { 
        console.error("Failed to parse spots visited:", e); 
      }
    }

    const fKey = userId ? `island_fairies_${userId}` : 'island_fairies_anon';
    const dKey = userId ? `island_fairies_dates_${userId}` : 'island_fairies_dates_anon';
    const storedF = localStorage.getItem(fKey);
    const storedD = localStorage.getItem(dKey);
    if (storedF) {
      try {
        const parsedF = JSON.parse(storedF);
        if (isMounted && Array.isArray(parsedF)) {
          setCollectedFairies(parsedF);
        }
      } catch (e) { console.error("Failed to parse fairies:", e); }
    }
    if (storedD) {
      try {
        const parsedD = JSON.parse(storedD);
        if (isMounted && typeof parsedD === 'object' && parsedD !== null) {
          setCollectedFairyDates(parsedD);
        }
      } catch (e) { console.error("Failed to parse fairy dates:", e); }
    }

    // Supabaseからの同期
    if (userId && isMounted) {
      try {
        const { data, error } = await supabase
          .from('island_visits')
          .select('island_id, status')
          .eq('user_id', userId);

        if (!isMounted) return;

        if (!error && data) {
          const merged: Record<string, IslandStatus> = { ...localData };
          data.forEach(row => {
            merged[row.island_id] = row.status as IslandStatus;
          });
          setIslandStatuses(merged);
          localStorage.setItem(storageKey, JSON.stringify(merged));
        }
      } catch (err) {
        console.error('Supabase sync error:', err);
      }
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const addIslandVisit = (islandId: string, islandObj?: any, newSpots: number = 0, isVerified: boolean = false) => {
    const isFirstVisit = (visitCounts[islandId] || 0) === 0;
    const gained = calculateIslandXP(islandObj || { id: islandId, name: islandId }, isFirstVisit, newSpots);

    // 回数加算
    setVisitCounts(prev => {
      const nextV = { ...prev, [islandId]: (prev[islandId] || 0) + 1 };
      const vKey = user ? `island_visits_count_${user.id}` : 'island_visits_count_anon';
      localStorage.setItem(vKey, JSON.stringify(nextV));
      return nextV;
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
      const rId = islandObj.region_id;
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

  const updateTravelerName = (name: string) => {
    setTravelerName(name);
    localStorage.setItem('kiratabi_traveler_name', name);
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

  const playerLvInfo = useMemo(() => getPlayerLevelInfo(totalPoints), [totalPoints]);
  const companionChar = useMemo(() => COMPANION_CHARACTERS[selectedCompanionId] || COMPANION_CHARACTERS.shimamaru, [selectedCompanionId]);
  const companionStage = useMemo(() => getCompanionStageInfo(selectedCompanionId, playerLvInfo.level), [selectedCompanionId, playerLvInfo.level]);

  const totalVisited = useMemo(() => Object.values(islandStatuses).filter(s => s === 'visited' || s === 'verified_visited').length, [islandStatuses]);

  return (
    <TravelContext.Provider value={{
      user,
      islandStatuses,
      updateStatus,
      totalVisited,
      travelerName,
      updateTravelerName,
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
      addIslandVisit,
      addSpotVisit
    }}>
      {children}
    </TravelContext.Provider>
  );
}

export const useTravel = () => useContext(TravelContext);
