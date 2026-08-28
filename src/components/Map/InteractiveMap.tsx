'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Tooltip, useMap, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTravel } from '@/context/TravelContext';
import { getIslandDifficulty } from '@/lib/difficulty';

export type MapStyle = 'pale' | 'voyager' | 'dark' | 'satellite';

interface InteractiveMapProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  islands: any[];
  bounds?: [[number, number], [number, number]];
  zoom?: number;
  mapStyle?: MapStyle;
  onIslandSelect?: (islandId: string) => void;
}

// Component to dynamically fit bounds when islands change
const FitBounds = ({ bounds }: { bounds: [[number, number], [number, number]] }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.flyToBounds(bounds, { padding: [50, 50], maxZoom: 12, duration: 1.5 });
    }
  }, [map, bounds]);
  return null;
};

export default function InteractiveMap({ islands, bounds, zoom = 5, mapStyle = 'voyager', onIslandSelect }: InteractiveMapProps) {
  const { islandStatuses } = useTravel();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null; // Avoid SSR hydration mismatch

  // Default to central Japan if no bounds provided
  const defaultBounds: [[number, number], [number, number]] = [[30, 128], [43, 144]];
  const mapBounds = bounds || defaultBounds;

  // Map Tile URLs (Watermark-free, High Reliability)
  const tileUrls = {
    pale: 'https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png',
    voyager: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    dark: 'https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
  };

  const attributions = {
    pale: '&copy; <a href="https://maps.gsi.go.jp/development/ichiran.html">国土地理院</a>',
    voyager: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    dark: '&copy; <a href="https://maps.gsi.go.jp/development/ichiran.html">国土地理院</a>',
    satellite: 'Tiles &copy; Esri'
  };

  return (
    <MapContainer 
      bounds={mapBounds}
      zoom={zoom} 
      style={{ height: '100%', width: '100%', background: mapStyle === 'dark' ? '#0f172a' : '#E3F2FD' }}
      zoomControl={false} // Hide default to maybe position it later or keep clean
      attributionControl={false}
    >
      <TileLayer
        url={tileUrls[mapStyle]}
        attribution={attributions[mapStyle]}
      />
      
      <FitBounds bounds={mapBounds} />

      {islands.map(island => {
        if (!island.coordinates) return null;
        const [latStr, lngStr] = island.coordinates.split(',');
        const lat = parseFloat(latStr);
        const lng = parseFloat(lngStr);
        if (isNaN(lat) || isNaN(lng)) return null;

        const status = islandStatuses[island.id] || 'none';
        const isVisited = status === 'visited' || status === 'verified_visited';
        const isPlanning = status === 'planning';
        const diffInfo = getIslandDifficulty(island);
        const level = diffInfo.level;
        const isRestricted = level === 0;

        let markerColor = '';
        let pulseEffect = '';
        let innerIcon = '';
        let sizeClass = 'w-4.5 h-4.5 text-[9px]';

        if (isRestricted) {
          // ⛔ 一般渡航制限島 (コンプリート対象外)
          markerColor = 'bg-slate-950 text-rose-500 border-2 border-rose-500 shadow-slate-950/90 ring-1 ring-rose-500/50';
          pulseEffect = `<div class="absolute -inset-1 rounded-full bg-rose-500/30 animate-pulse"></div>`;
          innerIcon = '⛔';
          sizeClass = 'w-6 h-6 text-[11px]';
        } else if (isVisited) {
          // 👑 到達達成
          markerColor = 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 border-2 border-white shadow-amber-500/50';
          pulseEffect = `<div class="absolute inset-0 rounded-full bg-amber-400 animate-ping opacity-30"></div>`;
          innerIcon = '👑';
          sizeClass = 'w-6 h-6 text-[10px]';
        } else if (isPlanning) {
          // ⭐️ 行きたい
          markerColor = 'bg-cyan-500 text-white border-2 border-white shadow-cyan-500/50';
          innerIcon = '⭐️';
          sizeClass = 'w-5 h-5 text-[9px]';
        } else {
          // ★1〜★5 難易度ごとの鮮やかな色分け
          switch (level) {
            case 5:
              // ★5 レジェンド (ルビーローズ)
              markerColor = 'bg-rose-600 text-white border-2 border-rose-200 shadow-rose-600/50';
              innerIcon = '★5';
              sizeClass = 'w-5 h-5 text-[8px]';
              break;
            case 4:
              // ★4 秘境島 (パープル)
              markerColor = 'bg-purple-600 text-white border-2 border-purple-200 shadow-purple-600/50';
              innerIcon = '★4';
              sizeClass = 'w-5 h-5 text-[8px]';
              break;
            case 3:
              // ★3 アドベンチャー (アンバー)
              markerColor = 'bg-amber-500 text-slate-950 border-2 border-amber-200 shadow-amber-500/50';
              innerIcon = '★3';
              sizeClass = 'w-4.5 h-4.5 text-[8px]';
              break;
            case 2:
              // ★2 スタンダード (サファイアブルー)
              markerColor = 'bg-blue-500 text-white border-2 border-blue-200 shadow-blue-500/50';
              innerIcon = '★2';
              sizeClass = 'w-4.5 h-4.5 text-[8px]';
              break;
            case 1:
            default:
              // ★1 イージー (エメラルドグリーン)
              markerColor = 'bg-emerald-500 text-white border-2 border-emerald-200 shadow-emerald-500/50';
              innerIcon = '★1';
              sizeClass = 'w-4 h-4 text-[7.5px]';
              break;
          }
        }

        const customIcon = L.divIcon({
          className: 'custom-island-marker',
          html: `<div class="relative flex items-center justify-center">
                   ${pulseEffect}
                   <div class="${sizeClass} ${markerColor} rounded-full shadow-md flex items-center justify-center font-bold z-10 transition-transform duration-300 hover:scale-150">
                     ${innerIcon}
                   </div>
                 </div>`,
          iconSize: isRestricted || isVisited ? [24, 24] : isPlanning || level >= 4 ? [20, 20] : [16, 16],
          iconAnchor: isRestricted || isVisited ? [12, 12] : isPlanning || level >= 4 ? [10, 10] : [8, 8],
        });

        // Set z-index so that visited/planning/restricted islands stay on top
        const zIndexOffset = isVisited ? 1000 : isRestricted ? 800 : isPlanning ? 500 : level * 50;

        return (
          <Marker
            key={island.id}
            position={[lat, lng]}
            icon={customIcon}
            zIndexOffset={zIndexOffset}
            eventHandlers={{
              click: () => {
                if (onIslandSelect) {
                  onIslandSelect(island.id);
                }
              }
            }}
          >
            <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent={false}>
              <div className="font-sans text-xs">
                {isRestricted ? (
                  <span className="text-rose-600 font-bold flex items-center gap-1">⛔ 【一般渡航不可・対象外】{island.name}</span>
                ) : isVisited ? (
                  <span className="text-amber-600 font-bold flex items-center gap-1">👑 【到達済】{island.name}</span>
                ) : isPlanning ? (
                  <span className="text-blue-600 font-bold flex items-center gap-1">⭐️ 【行きたい】{island.name}</span>
                ) : (
                  <span className="text-slate-800 font-bold flex items-center gap-1">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] text-white ${diffInfo.badgeColor}`}>★{level}</span>
                    {island.name}
                  </span>
                )}
              </div>
            </Tooltip>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
