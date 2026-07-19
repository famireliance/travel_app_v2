'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useRouter } from 'next/navigation';
import { useTravel } from '@/context/TravelContext';

interface InteractiveMapProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  islands: any[];
  bounds?: [[number, number], [number, number]];
  zoom?: number;
}

// Component to dynamically fit bounds when islands change
const FitBounds = ({ bounds }: { bounds: [[number, number], [number, number]] }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
    }
  }, [map, bounds]);
  return null;
};

export default function InteractiveMap({ islands, bounds, zoom = 5 }: InteractiveMapProps) {
  const router = useRouter();
  const { islandStatuses } = useTravel();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null; // Avoid SSR hydration mismatch

  // Default to central Japan if no bounds provided
  const defaultBounds: [[number, number], [number, number]] = [[30, 128], [43, 144]];
  const mapBounds = bounds || defaultBounds;

  return (
    <MapContainer 
      bounds={mapBounds}
      zoom={zoom} 
      style={{ height: '100%', width: '100%', background: '#E3F2FD' }} // Ocean color background
      zoomControl={true}
      attributionControl={false}
    >
      {/* GSI Pale Map (国土地理院 淡色地図) */}
      <TileLayer
        url="https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://maps.gsi.go.jp/development/ichiran.html">国土地理院</a>'
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

        const markerColor = isVisited ? '#F59E0B' : isPlanning ? '#3B82F6' : '#94A3B8';
        const borderColor = isVisited ? '#92400E' : isPlanning ? '#1E3A8A' : '#334155';
        const markerRadius = isVisited ? 12 : isPlanning ? 10 : 8;
        const markerWeight = isVisited ? 3.5 : isPlanning ? 2.5 : 2;

        return (
          <CircleMarker
            key={island.id}
            center={[lat, lng]}
            radius={markerRadius}
            pathOptions={{ 
              fillColor: markerColor, 
              fillOpacity: 1, 
              color: borderColor, 
              weight: markerWeight 
            }}
            eventHandlers={{
              click: () => {
                router.push(`/island/${island.id}`);
              }
            }}
          >
            <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent={false}>
              {isVisited ? (
                <span className="font-serif tracking-widest text-amber-900 font-bold flex items-center gap-1">👑 【到達済】{island.name}</span>
              ) : isPlanning ? (
                <span className="font-serif tracking-widest text-blue-900 font-bold flex items-center gap-1">⭐️ 【行きたい】{island.name}</span>
              ) : (
                <span className="font-serif tracking-widest text-slate-800">{island.name}</span>
              )}
            </Tooltip>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
