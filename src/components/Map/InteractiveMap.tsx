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
        const isRestricted = getIslandDifficulty(island).level === 0;

        const markerColor = isRestricted 
          ? 'bg-slate-900 text-amber-400 border-2 border-amber-400/90 shadow-slate-950/80 ring-2 ring-slate-900/50' 
          : isVisited 
          ? 'bg-amber-400 text-slate-950 border-2 border-white shadow-amber-500/50' 
          : isPlanning 
          ? 'bg-blue-500 text-white border-2 border-white shadow-blue-500/50' 
          : 'bg-slate-600 text-white border-2 border-white shadow-slate-700/50';

        const pulseEffect = isVisited 
          ? `<div class="absolute inset-0 rounded-full bg-amber-400 animate-ping opacity-30"></div>` 
          : isRestricted 
          ? `<div class="absolute -inset-1 rounded-full bg-amber-500/20 animate-pulse"></div>`
          : '';

        const innerIcon = isRestricted ? '🔒' : isVisited ? '👑' : isPlanning ? '⭐️' : '';
        const sizeClass = isRestricted ? 'w-6 h-6 text-[11px]' : isVisited ? 'w-6 h-6 text-[10px]' : isPlanning ? 'w-5 h-5 text-[9px]' : 'w-4 h-4 text-[8px]';

        const customIcon = L.divIcon({
          className: 'custom-island-marker',
          html: `<div class="relative flex items-center justify-center">
                   ${pulseEffect}
                   <div class="${sizeClass} ${markerColor} rounded-full shadow-md flex items-center justify-center font-bold z-10 transition-transform duration-300 hover:scale-150">
                     ${innerIcon}
                   </div>
                 </div>`,
          iconSize: isRestricted || isVisited ? [24, 24] : isPlanning ? [20, 20] : [16, 16],
          iconAnchor: isRestricted || isVisited ? [12, 12] : isPlanning ? [10, 10] : [8, 8],
        });

        // Set z-index so that visited/planning/restricted islands stay on top
        const zIndexOffset = isRestricted ? 800 : isVisited ? 1000 : isPlanning ? 500 : 0;

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
              <div className="font-sans">
                {isRestricted ? (
                  <span className="text-amber-500 font-bold flex items-center gap-1">🔒 【渡航制限島・対象外】{island.name}</span>
                ) : isVisited ? (
                  <span className="text-amber-600 font-bold flex items-center gap-1">👑 【到達済】{island.name}</span>
                ) : isPlanning ? (
                  <span className="text-blue-600 font-bold flex items-center gap-1">⭐️ 【行きたい】{island.name}</span>
                ) : (
                  <span className="text-slate-800 font-bold">{island.name}</span>
                )}
              </div>
            </Tooltip>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
