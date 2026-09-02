'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Tooltip, useMap, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Supercluster from 'supercluster';
import { useTravel } from '@/context/TravelContext';
import { getIslandDifficulty } from '@/lib/difficulty';
import { Filter, Layers, CheckCircle, Star, Sparkles } from 'lucide-react';

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

// Component that manages supercluster clustering & map events
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ClusteredMarkers = ({ islands, islandStatuses, onIslandSelect }: { islands: any[], islandStatuses: Record<string, string>, onIslandSelect?: (id: string) => void }) => {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());
  const [bounds, setBounds] = useState<[number, number, number, number] | null>(null);

  // Update bounds & zoom when map moves
  const updateMapState = useCallback(() => {
    const b = map.getBounds();
    setBounds([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]);
    setZoom(map.getZoom());
  }, [map]);

  useEffect(() => {
    updateMapState();
    map.on('moveend', updateMapState);
    map.on('zoomend', updateMapState);
    return () => {
      map.off('moveend', updateMapState);
      map.off('zoomend', updateMapState);
    };
  }, [map, updateMapState]);

  // Convert islands to GeoJSON points for Supercluster
  const points = useMemo(() => {
    return islands.map(island => {
      if (!island.coordinates) return null;
      const [latStr, lngStr] = island.coordinates.split(',');
      const lat = parseFloat(latStr);
      const lng = parseFloat(lngStr);
      if (isNaN(lat) || isNaN(lng)) return null;

      const status = islandStatuses[island.id] || 'none';
      const isVisited = status === 'visited' || status === 'verified_visited';
      const isPlanning = status === 'planning';
      const diffInfo = getIslandDifficulty(island);

      return {
        type: 'Feature' as const,
        properties: {
          cluster: false,
          islandId: island.id,
          island,
          isVisited,
          isPlanning,
          level: diffInfo.level,
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [lng, lat],
        },
      };
    }).filter(Boolean);
  }, [islands, islandStatuses]);

  // Create Supercluster instance
  const supercluster = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sc = new Supercluster<any>({
      radius: 45,
      maxZoom: 14,
    });
    sc.load(points as any);
    return sc;
  }, [points]);

  // Get current clusters
  const clusters = useMemo(() => {
    if (!bounds) return [];
    return supercluster.getClusters(bounds, Math.floor(zoom));
  }, [supercluster, bounds, zoom]);

  return (
    <>
      {clusters.map(cluster => {
        const [lng, lat] = cluster.geometry.coordinates;
        const { cluster: isCluster, point_count: pointCount } = cluster.properties;

        if (isCluster) {
          // Render Cluster Marker with custom glowing glassmorphism style
          const clusterIcon = L.divIcon({
            className: 'custom-cluster-marker',
            html: `<div class="relative flex items-center justify-center cursor-pointer group">
                     <div class="absolute -inset-2 rounded-full bg-blue-500/20 blur-md group-hover:bg-blue-400/40 transition-all"></div>
                     <div class="w-10 h-10 rounded-full bg-slate-900/90 border-2 border-cyan-400 text-cyan-300 font-bold text-xs flex items-center justify-center shadow-lg shadow-cyan-500/30 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
                       <span className="font-mono">${pointCount}</span>
                     </div>
                   </div>`,
            iconSize: [40, 40],
            iconAnchor: [20, 20],
          });

          return (
            <Marker
              key={`cluster-${cluster.id}`}
              position={[lat, lng]}
              icon={clusterIcon}
              eventHandlers={{
                click: () => {
                  const expansionZoom = Math.min(
                    supercluster.getClusterExpansionZoom(cluster.id as number),
                    14
                  );
                  map.setView([lat, lng], expansionZoom, { animate: true });
                },
              }}
            />
          );
        }

        // Render Individual Island Marker
        const { island, isVisited, isPlanning, level } = cluster.properties;
        const diffInfo = getIslandDifficulty(island);
        const isRestricted = level === 0;

        let markerColor = '';
        let pulseEffect = '';
        let innerIcon = '';
        let sizeClass = 'w-4.5 h-4.5 text-[9px]';

        if (isRestricted) {
          markerColor = 'bg-slate-950 text-rose-500 border-2 border-rose-500 shadow-slate-950/90 ring-1 ring-rose-500/50';
          pulseEffect = `<div class="absolute -inset-1 rounded-full bg-rose-500/30 animate-pulse"></div>`;
          innerIcon = '⛔';
          sizeClass = 'w-6 h-6 text-[11px]';
        } else if (isVisited) {
          markerColor = 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 border-2 border-white shadow-amber-500/50';
          pulseEffect = `<div class="absolute inset-0 rounded-full bg-amber-400 animate-ping opacity-30"></div>`;
          innerIcon = '👑';
          sizeClass = 'w-6 h-6 text-[10px]';
        } else if (isPlanning) {
          markerColor = 'bg-cyan-500 text-white border-2 border-white shadow-cyan-500/50';
          innerIcon = '⭐️';
          sizeClass = 'w-5 h-5 text-[9px]';
        } else {
          switch (level) {
            case 5:
              markerColor = 'bg-rose-600 text-white border-2 border-rose-200 shadow-rose-600/50';
              innerIcon = '★5';
              sizeClass = 'w-5 h-5 text-[8px]';
              break;
            case 4:
              markerColor = 'bg-purple-600 text-white border-2 border-purple-200 shadow-purple-600/50';
              innerIcon = '★4';
              sizeClass = 'w-5 h-5 text-[8px]';
              break;
            case 3:
              markerColor = 'bg-amber-500 text-slate-950 border-2 border-amber-200 shadow-amber-500/50';
              innerIcon = '★3';
              sizeClass = 'w-4.5 h-4.5 text-[8px]';
              break;
            case 2:
              markerColor = 'bg-blue-500 text-white border-2 border-blue-200 shadow-blue-500/50';
              innerIcon = '★2';
              sizeClass = 'w-4.5 h-4.5 text-[8px]';
              break;
            case 1:
            default:
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
    </>
  );
};

export default function InteractiveMap({ islands, bounds, zoom = 5, mapStyle = 'voyager', onIslandSelect }: InteractiveMapProps) {
  const { islandStatuses } = useTravel();
  const [mounted, setMounted] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unvisited' | 'visited' | 'planning' | 'star5'>('all');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Filter islands according to current filter
  const filteredIslands = useMemo(() => {
    return islands.filter(island => {
      const status = islandStatuses[island.id] || 'none';
      const isVisited = status === 'visited' || status === 'verified_visited';
      const isPlanning = status === 'planning';
      const diffInfo = getIslandDifficulty(island);

      if (selectedFilter === 'visited') return isVisited;
      if (selectedFilter === 'planning') return isPlanning;
      if (selectedFilter === 'unvisited') return !isVisited && !isPlanning;
      if (selectedFilter === 'star5') return diffInfo.level === 5;
      return true;
    });
  }, [islands, islandStatuses, selectedFilter]);

  if (!mounted) return null;

  const defaultBounds: [[number, number], [number, number]] = [[30, 128], [43, 144]];
  const mapBounds = bounds || defaultBounds;

  const tileUrls = {
    pale: 'https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png',
    voyager: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    dark: 'https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
  };

  const attributions = {
    pale: '&copy; 国土地理院',
    voyager: '&copy; OpenStreetMap',
    dark: '&copy; 国土地理院',
    satellite: 'Tiles &copy; Esri'
  };

  return (
    <div className="relative w-full h-full">
      {/* Floating Filter Bar */}
      <div className="absolute top-4 left-4 z-[1000] flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md p-1.5 rounded-2xl border border-slate-700/50 shadow-xl overflow-x-auto max-w-[90vw]">
        <button
          onClick={() => setSelectedFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
            selectedFilter === 'all' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          全 {islands.length} 島
        </button>
        <button
          onClick={() => setSelectedFilter('unvisited')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
            selectedFilter === 'unvisited' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          未訪問
        </button>
        <button
          onClick={() => setSelectedFilter('visited')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
            selectedFilter === 'visited' ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <CheckCircle className="w-3.5 h-3.5" />
          到達済
        </button>
        <button
          onClick={() => setSelectedFilter('planning')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
            selectedFilter === 'planning' ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/30' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Star className="w-3.5 h-3.5" />
          行きたい
        </button>
        <button
          onClick={() => setSelectedFilter('star5')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
            selectedFilter === 'star5' ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          ★5 秘境
        </button>
      </div>

      <MapContainer 
        bounds={mapBounds}
        zoom={zoom} 
        style={{ height: '100%', width: '100%', background: mapStyle === 'dark' ? '#0f172a' : '#E3F2FD' }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url={tileUrls[mapStyle]}
          attribution={attributions[mapStyle]}
        />
        
        <FitBounds bounds={mapBounds} />

        <ClusteredMarkers 
          islands={filteredIslands}
          islandStatuses={islandStatuses}
          onIslandSelect={onIslandSelect}
        />
      </MapContainer>
    </div>
  );
}
