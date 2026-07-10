'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useRouter } from 'next/navigation';
import L from 'leaflet';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface InteractiveMapProps {
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

        return (
          <CircleMarker
            key={island.id}
            center={[lat, lng]}
            radius={8}
            pathOptions={{ 
              fillColor: 'white', 
              fillOpacity: 1, 
              color: '#0F4C81', 
              weight: 3 
            }}
            eventHandlers={{
              click: () => {
                router.push(`/island/${island.id}`);
              }
            }}
          >
            <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent={false}>
              <span className="font-serif tracking-widest text-slate-800">{island.name}</span>
            </Tooltip>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
