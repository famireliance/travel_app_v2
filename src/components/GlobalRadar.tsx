'use client';
import React, { useState, useEffect } from 'react';
import { calculateDistanceKm } from '@/lib/geo';
import { useTravel } from '@/context/TravelContext';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Navigation2 } from 'lucide-react';
import { fetchAllIslands } from '@/lib/supabase';

interface RadarIsland {
  id: string;
  slug?: string;
  name: string;
  coordinates?: string;
  distance?: number;
}

interface GlobalRadarProps {
  isModalOpen?: boolean;
}

export default function GlobalRadar({ isModalOpen: externalModalOpen = false }: GlobalRadarProps = {}) {
  const [nearbyIsland, setNearbyIsland] = useState<RadarIsland | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [domModalOpen, setDomModalOpen] = useState(false);
  const { islandStatuses } = useTravel();
  const router = useRouter();
  const pathname = usePathname();

  const isModalOpen = externalModalOpen || domModalOpen;
  const isGlobeOrMap = pathname === '/map' || pathname === '/globe' || pathname?.startsWith('/globe/');

  const isRestrictedPortal =
    pathname?.startsWith('/kira-system-panel-9f2') ||
    pathname?.startsWith('/biz-portal-secure-8f92a1b3') ||
    (typeof window !== 'undefined' &&
      (window.location.hostname.startsWith('ops-vault-') ||
        window.location.hostname.startsWith('partner.') ||
        window.location.hostname.startsWith('biz.')));

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (sessionStorage.getItem('kiratabi_radar_dismissed') === 'true') {
        setIsDismissed(true);
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Detect any open modal overlays in DOM so radar banner never overlaps modals
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const checkModals = () => {
      const modalOverlay = document.querySelector('[role="dialog"], .fixed.inset-0');
      setDomModalOpen(Boolean(modalOverlay));
    };
    checkModals();
    const observer = new MutationObserver(checkModals);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isRestrictedPortal || isDismissed) return;
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;

    let mounted = true;

    const checkLocation = async () => {
      try {
        if (sessionStorage.getItem('kiratabi_radar_dismissed') === 'true') return;
      } catch {}

      // Do NOT call getCurrentPosition unless geolocation permission is already 'granted'
      // (prevents unsolicited GPS permission popups on iOS Safari / mobile browsers on first visit)
      if (!navigator.permissions || typeof navigator.permissions.query !== 'function') {
        return;
      }
      try {
        const permStatus = await navigator.permissions.query({ name: 'geolocation' });
        if (permStatus.state !== 'granted' || !mounted) {
          return;
        }
      } catch {
        return;
      }

      const islands = await fetchAllIslands();
      if (!islands || !mounted) return;

      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (!mounted) return;
          const { latitude: userLat, longitude: userLng } = position.coords;
          let closestIsland: RadarIsland | null = null;
          let minDistance = Infinity;

          islands.forEach(island => {
            if (island.coordinates) {
              const [islandLatStr, islandLngStr] = (island.coordinates as string).split(',').map((s: string) => s.trim());
              const islandLat = parseFloat(islandLatStr);
              const islandLng = parseFloat(islandLngStr);
              const distance = calculateDistanceKm(userLat, userLng, islandLat, islandLng);
              
              if (distance < minDistance) {
                minDistance = distance;
                closestIsland = island as any;
              }
            }
          });

          // If closest island is within 10km and not verified visited yet
          if (closestIsland && minDistance <= 10) {
            const status = islandStatuses[(closestIsland as any).id];
            if (status !== 'verified_visited') {
              setNearbyIsland({ ...(closestIsland as any), distance: minDistance });
              setIsVisible(true);
            }
          }
        },
        (error) => {
          console.warn("Geolocation radar error:", error);
        },
        { enableHighAccuracy: false, maximumAge: 60000, timeout: 5000 }
      );
    };

    // Check once after 5 seconds
    const timer = setTimeout(() => {
      void checkLocation();
    }, 5000);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [islandStatuses, isRestrictedPortal, isDismissed]);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    try {
      sessionStorage.setItem('kiratabi_radar_dismissed', 'true');
    } catch {
      // Ignore storage errors
    }
  };

  if (isRestrictedPortal || isGlobeOrMap || isDismissed || isModalOpen || !nearbyIsland) return null;

  return (
    <AnimatePresence>
      {isVisible && !isModalOpen && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-24 lg:bottom-6 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-sm"
        >
          <div className="bg-white/95 backdrop-blur-xl p-4 rounded-2xl shadow-2xl border border-blue-100 flex items-start gap-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-400 to-indigo-600" />
            <button 
              onClick={handleDismiss}
              aria-label="閉じる"
              className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-100"
            >
              ✕
            </button>
            <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5 text-blue-600 animate-bounce" />
            </div>
            <div className="flex-1 pr-4">
              <p className="text-[0.6rem] font-bold text-blue-600 tracking-wider mb-0.5">NEARBY RADAR</p>
              <h3 className="font-serif font-bold text-slate-800 text-sm mb-1">{nearbyIsland.name}が近くにあります！</h3>
              <p className="text-xs text-slate-500 mb-3 leading-relaxed">現在地から約 {nearbyIsland.distance!.toFixed(1)} kmです。チェックインして公式到達証明を発行しませんか？</p>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    handleDismiss();
                    router.push(`/island/${nearbyIsland.slug || nearbyIsland.id}`);
                  }}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-md shadow-blue-900/20"
                >
                  <Navigation2 size={14} />
                  チェックインする
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
