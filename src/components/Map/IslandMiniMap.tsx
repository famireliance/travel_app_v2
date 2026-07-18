'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface IslandMiniMapProps {
  coordinates?: string;
  name?: string;
}

export default function IslandMiniMap({ coordinates, name = 'この島' }: IslandMiniMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !coordinates) return null;

  const parts = coordinates.split(',').map(s => parseFloat(s.trim()));
  const lat = parts[0];
  const lng = parts[1];

  if (isNaN(lat) || isNaN(lng)) return null;

  return (
    <div className="w-full h-64 sm:h-80 rounded-2xl overflow-hidden border border-slate-200 shadow-inner relative z-10">
      <MapContainer 
        center={[lat, lng]} 
        zoom={9} 
        style={{ height: '100%', width: '100%', background: '#E3F2FD' }}
        zoomControl={true}
        attributionControl={false}
      >
        <TileLayer
          url="https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://maps.gsi.go.jp/development/ichiran.html">国土地理院</a>'
        />
        <CircleMarker
          center={[lat, lng]}
          radius={12}
          pathOptions={{ 
            fillColor: '#3B82F6', 
            fillOpacity: 0.9, 
            color: '#1E3A8A', 
            weight: 3 
          }}
        >
          <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent={true}>
            <span className="font-serif tracking-widest text-slate-900 font-bold">{name}</span>
          </Tooltip>
        </CircleMarker>
      </MapContainer>
    </div>
  );
}
