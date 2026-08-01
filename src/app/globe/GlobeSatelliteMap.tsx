'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';

// Import Globe only on client side to avoid SSR issues with canvas/WebGL
const Globe = dynamic(() => import('react-globe.gl'), { ssr: false });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface GlobeSatelliteMapProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  islands: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  visitedList: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  selectedIsland: any | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSelectIsland: (island: any) => void;
  center?: [number, number];
  zoom?: number;
  mapStyleMode?: 'satellite' | 'dark_ocean';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getIslandCoords(island: any): { lat: number; lng: number } {
  if (island?.coordinates) {
    const matchDecimal = island.coordinates.match(/([0-9.]+)[^0-9.]+([0-9.]+)/);
    if (matchDecimal) {
      let lat = parseFloat(matchDecimal[1]);
      let lng = parseFloat(matchDecimal[2]);
      if (island.coordinates.includes('S')) lat = -lat;
      if (island.coordinates.includes('W')) lng = -lng;
      if (lat > -90 && lat < 90 && lng > -180 && lng < 180) {
        return { lat, lng };
      }
    }
  }
  return { lat: 35.689, lng: 139.691 };
}

export default function GlobeSatelliteMap({
  islands,
  visitedList,
  selectedIsland,
  onSelectIsland,
  center = [35.65, 139.76],
  zoom = 5,
  mapStyleMode = 'satellite'
}: GlobeSatelliteMapProps) {
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globeEl = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    handleResize();
    // Use a small delay for initial resize to ensure DOM is ready
    setTimeout(handleResize, 100);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update camera on center change
  useEffect(() => {
    if (globeEl.current && center && mounted) {
      // For globe.gl, altitude defines zoom. Lower altitude = higher zoom.
      // Zoom 5 -> alt 1, Zoom 11 -> alt 0.2
      const baseAlt = 1.2;
      let alt = baseAlt;
      if (zoom > 5) {
        alt = Math.max(0.05, 5 / zoom);
      } else {
        alt = baseAlt;
      }
      
      globeEl.current.pointOfView({ lat: center[0], lng: center[1], altitude: alt }, 1500);
    }
  }, [center, zoom, mounted]);

  const tokyoHub = { lat: 35.65, lng: 139.76, name: '東京港' };
  const visitedIds = new Set(visitedList.map(v => v.id));

  // Compute arcs from Tokyo to all visited islands
  const arcsData = useMemo(() => {
    return visitedList.map(island => {
      const coords = getIslandCoords(island);
      return {
        startLat: tokyoHub.lat,
        startLng: tokyoHub.lng,
        endLat: coords.lat,
        endLng: coords.lng,
        color: ['rgba(245, 158, 11, 0.2)', 'rgba(236, 72, 153, 0.8)'],
        name: island.name
      };
    });
  }, [visitedList]);

  // Compute rings (ripples) for selected island
  const ringsData = useMemo(() => {
    if (selectedIsland) {
      const coords = getIslandCoords(selectedIsland);
      return [{ lat: coords.lat, lng: coords.lng, color: '#EC4899', maxR: 2 }];
    }
    return [];
  }, [selectedIsland]);

  // Compute points for all islands
  const pointsData = useMemo(() => {
    return islands.map(island => {
      const coords = getIslandCoords(island);
      const isVisited = visitedIds.has(island.id);
      const isSelected = selectedIsland?.id === island.id;
      return {
        ...island,
        lat: coords.lat,
        lng: coords.lng,
        // Visited islands are larger and gold, unvisited are small and blue, selected is largest and pink
        size: isSelected ? 0.4 : isVisited ? 0.2 : 0.05,
        color: isSelected ? '#EC4899' : isVisited ? '#F59E0B' : '#38BDF8',
      };
    });
  }, [islands, visitedIds, selectedIsland]);

  if (!mounted || dimensions.width === 0) return null;

  return (
    <div ref={containerRef} className="w-full h-full relative bg-slate-950 overflow-hidden cursor-move">
      <Globe
        ref={globeEl}
        width={dimensions.width}
        height={dimensions.height}
        globeImageUrl={mapStyleMode === 'satellite' ? "//unpkg.com/three-globe/example/img/earth-blue-marble.jpg" : "//unpkg.com/three-globe/example/img/earth-dark.jpg"}
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        
        // Arcs (Flight routes)
        arcsData={arcsData}
        arcColor="color"
        arcDashLength={0.4}
        arcDashGap={2}
        arcDashInitialGap={() => Math.random() * 5}
        arcDashAnimateTime={3000}
        arcStroke={0.5}

        // Rings (Selected Island Radar)
        ringsData={ringsData}
        ringColor="color"
        ringMaxRadius="maxR"
        ringPropagationSpeed={3}
        ringRepeatPeriod={800}

        // Points (Islands)
        pointsData={pointsData}
        pointColor="color"
        pointAltitude="size"
        pointRadius="size"
        pointResolution={32}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        pointLabel={(d: any) => `
          <div class="bg-slate-900/90 p-2 rounded-lg border border-white/20 text-white font-serif text-sm backdrop-blur-md pointer-events-none shadow-xl">
            <b>${d.name}</b> (${d.prefecture})<br/>
            <span class="text-xs text-slate-400">${d.region_id}</span>
            ${visitedIds.has(d.id) ? '<br/><span class="text-[0.65rem] text-amber-400 font-bold">到達済</span>' : ''}
          </div>
        `}
        onPointClick={onSelectIsland}

        // Custom HTML for Tokyo Hub
        htmlElementsData={[tokyoHub]}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        htmlElement={(d: any) => {
          const el = document.createElement('div');
          el.innerHTML = '🗼';
          el.style.color = 'white';
          el.style.fontSize = '16px';
          el.style.pointerEvents = 'none';
          el.style.transform = 'translate(-50%, -50%)';
          return el;
        }}
      />
      <div className="absolute top-4 right-4 z-[10] bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-[0.65rem] font-mono text-indigo-300 flex items-center gap-2 pointer-events-none">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>3D WEBGL GLOBE ENGINE</span>
      </div>
    </div>
  );
}
