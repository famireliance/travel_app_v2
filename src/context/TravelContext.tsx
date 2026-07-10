'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

type IslandStatus = 'planning' | 'visited' | 'none';

interface TravelContextType {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user: any;
  islandStatuses: Record<string, IslandStatus>;
  updateStatus: (islandId: string, status: IslandStatus) => void;
  totalVisited: number;
}

const TravelContext = createContext<TravelContextType>({
  user: null,
  islandStatuses: {},
  updateStatus: () => {},
  totalVisited: 0
});

export function TravelProvider({ children }: { children: React.ReactNode }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any>(null);
  const [islandStatuses, setIslandStatuses] = useState<Record<string, IslandStatus>>({});

  // Auth & Data Load
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user || null;
      setUser(currentUser);
      loadLocalData(currentUser?.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user || null;
      setUser(currentUser);
      loadLocalData(currentUser?.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadLocalData = (userId?: string) => {
    const storageKey = userId ? `island_status_${userId}` : 'island_status_anon';
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        setIslandStatuses(JSON.parse(stored));
      } catch (e) {
        setIslandStatuses({});
      }
    } else {
      setIslandStatuses({});
    }
    // Future: Fetch from Supabase `user_islands` table if user exists
  };

  const updateStatus = (islandId: string, status: IslandStatus) => {
    setIslandStatuses(prev => {
      const next = { ...prev };
      if (status === 'none') {
        delete next[islandId];
      } else {
        next[islandId] = status;
      }
      
      // Save
      const storageKey = user ? `island_status_${user.id}` : 'island_status_anon';
      localStorage.setItem(storageKey, JSON.stringify(next));
      // Future: Upsert to Supabase `user_islands` table if user exists

      return next;
    });
  };

  const totalVisited = Object.values(islandStatuses).filter(s => s === 'visited').length;

  return (
    <TravelContext.Provider value={{ user, islandStatuses, updateStatus, totalVisited }}>
      {children}
    </TravelContext.Provider>
  );
}

export const useTravel = () => useContext(TravelContext);
