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

  const loadLocalData = async (userId?: string) => {
    const storageKey = userId ? `island_status_${userId}` : 'island_status_anon';
    const stored = localStorage.getItem(storageKey);
    let localData: Record<string, IslandStatus> = {};
    if (stored) {
      try {
        localData = JSON.parse(stored);
        setIslandStatuses(localData);
      } catch (e) {
        setIslandStatuses({});
      }
    } else {
      setIslandStatuses({});
    }

    // Supabaseからの同期
    if (userId) {
      try {
        const { data, error } = await supabase
          .from('island_visits')
          .select('island_id, status')
          .eq('user_id', userId);

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
      
      // Save to LocalStorage
      const storageKey = user ? `island_status_${user.id}` : 'island_status_anon';
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });

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

  const totalVisited = Object.values(islandStatuses).filter(s => s === 'visited').length;

  return (
    <TravelContext.Provider value={{ user, islandStatuses, updateStatus, totalVisited }}>
      {children}
    </TravelContext.Provider>
  );
}

export const useTravel = () => useContext(TravelContext);
