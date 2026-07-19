'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { calculateIslandXP, getPlayerLevelInfo } from '@/lib/gamification';
import { CompanionId, CompanionStageInfo, CompanionCharacter, COMPANION_CHARACTERS, getCompanionStageInfo } from '@/lib/companion';
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addIslandVisit: (islandId: string, islandObj?: any, newSpots?: number) => { xpGained: number };
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
  addIslandVisit: () => ({ xpGained: 0 })
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
  const addIslandVisit = (islandId: string, islandObj?: any, newSpots: number = 0) => {
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

    // XP加算
    if (gained > 0) {
      setTotalXP(prev => {
        const nextXP = prev + gained;
        localStorage.setItem('kiratabi_total_xp', String(nextXP));
        return nextXP;
      });
    }

    // ステータスをvisitedへ同期
    updateStatus(islandId, 'visited');

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
      addIslandVisit
    }}>
      {children}
    </TravelContext.Provider>
  );
}

export const useTravel = () => useContext(TravelContext);
