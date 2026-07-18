'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
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

// カメラをスムーズに移動させる補助コンポーネント
const CameraController = ({ center, zoom }: { center?: [number, number]; zoom?: number }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom || 6, {
        animate: true,
        duration: 1.4,
        easeLinearity: 0.25
      });
    }
  }, [map, center, zoom]);
  return null;
};

// 大圏航路（放物線風の滑らかな曲線）座標計算
function getCurvedFlightRoute(from: [number, number], to: [number, number], numPoints = 40): [number, number][] {
  const points: [number, number][] = [];
  const [lat1, lng1] = from;
  const [lat2, lng2] = to;

  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    // 線形補間
    const lat = lat1 + (lat2 - lat1) * t;
    const lng = lng1 + (lng2 - lng1) * t;
    // 中間地点でわずかに北（または南）へアーチさせて3D放物線・大圏航路感を演出
    const arcHeight = Math.sin(t * Math.PI) * Math.min(6, Math.abs(lng2 - lng1) * 0.25);
    points.push([lat + arcHeight, lng]);
  }
  return points;
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
  const [dashOffset, setDashOffset] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // フライトラインのアニメーション効果
  useEffect(() => {
    const interval = setInterval(() => {
      setDashOffset(prev => (prev - 1) % 100);
    }, 40);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  const tokyoHub: [number, number] = [35.65, 139.76]; // 竹芝桟橋 / 東京港
  const visitedIds = new Set(visitedList.map(v => v.id));

  // 選択中の島とのフライト曲線
  let selectedRoute: [number, number][] | null = null;
  if (selectedIsland) {
    const coordsStr = selectedIsland.coordinates;
    if (coordsStr) {
      const matchDecimal = coordsStr.match(/([0-9.]+)[^0-9.]+([0-9.]+)/);
      if (matchDecimal) {
        let lat = parseFloat(matchDecimal[1]);
        let lng = parseFloat(matchDecimal[2]);
        if (coordsStr.includes('S')) lat = -lat;
        if (coordsStr.includes('W')) lng = -lng;
        selectedRoute = getCurvedFlightRoute(tokyoHub, [lat, lng]);
      }
    }
  }

  return (
    <div className="w-full h-full relative rounded-3xl overflow-hidden border border-amber-500/30 shadow-2xl bg-slate-950">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%', background: '#040d21' }}
        zoomControl={false}
        attributionControl={false}
      >
        <CameraController center={center} zoom={zoom} />

        {/* 1. ベースタイル：ESRI World Imagery (高精細衛星航空写真・ディープオーシャン) */}
        {mapStyleMode === 'satellite' ? (
          <>
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution='&copy; Esri'
            />
            {/* 地名・国境・境界線ラベル (ハイブリッドオーバーレイ) */}
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
              attribution='&copy; Esri'
            />
          </>
        ) : (
          /* 2. ダークサイバーオーシャンモード (CartoDB Dark Matter) */
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; OpenStreetMap & CartoDB'
          />
        )}

        {/* 3. 起点：東京港（竹芝ターミナル）ピン */}
        <CircleMarker
          center={tokyoHub}
          radius={12}
          pathOptions={{ fillColor: '#F43F5E', fillOpacity: 1, color: '#FFFFFF', weight: 3 }}
        >
          <Tooltip direction="top" offset={[0, -10]} permanent={false}>
            <span className="font-serif font-bold text-rose-950">🚀 起点：東京港・竹芝ターミナル</span>
          </Tooltip>
        </CircleMarker>
        <CircleMarker
          center={tokyoHub}
          radius={20}
          pathOptions={{ fillColor: '#F43F5E', fillOpacity: 0.25, color: '#F43F5E', weight: 1, dashArray: '4,4' }}
        />

        {/* 4. 到達済み離島へのフライト・フェリー航路 (ゴールドライン) */}
        {visitedList.map(island => {
          if (!island.coordinates) return null;
          const matchDecimal = island.coordinates.match(/([0-9.]+)[^0-9.]+([0-9.]+)/);
          if (!matchDecimal) return null;
          let lat = parseFloat(matchDecimal[1]);
          let lng = parseFloat(matchDecimal[2]);
          if (island.coordinates.includes('S')) lat = -lat;
          if (island.coordinates.includes('W')) lng = -lng;

          const route = getCurvedFlightRoute(tokyoHub, [lat, lng]);
          return (
            <Polyline
              key={`route-${island.id}`}
              positions={route}
              pathOptions={{
                color: '#F59E0B',
                weight: 2,
                opacity: 0.6,
                dashArray: '6, 8',
                dashOffset: `${dashOffset}px`
              }}
            />
          );
        })}

        {/* 5. 選択中の島への強調フライト航路（ピンクゴールド発光ライン） */}
        {selectedRoute && (
          <>
            <Polyline
              positions={selectedRoute}
              pathOptions={{
                color: '#EC4899',
                weight: 4,
                opacity: 0.95
              }}
            />
            <Polyline
              positions={selectedRoute}
              pathOptions={{
                color: '#FFFFFF',
                weight: 2,
                dashArray: '12, 12',
                dashOffset: `${-dashOffset * 2}px`,
                opacity: 0.9
              }}
            />
          </>
        )}

        {/* 6. 全国離島マーカープロット */}
        {islands.map(island => {
          if (!island.coordinates) return null;
          const matchDecimal = island.coordinates.match(/([0-9.]+)[^0-9.]+([0-9.]+)/);
          if (!matchDecimal) return null;
          let lat = parseFloat(matchDecimal[1]);
          let lng = parseFloat(matchDecimal[2]);
          if (island.coordinates.includes('S')) lat = -lat;
          if (island.coordinates.includes('W')) lng = -lng;

          const isVisited = visitedIds.has(island.id);
          const isSelected = selectedIsland?.id === island.id;

          const radius = isSelected ? 13 : isVisited ? 10 : 6;
          const fillColor = isSelected ? '#EC4899' : isVisited ? '#F59E0B' : '#38BDF8';
          const borderColor = isSelected ? '#FFFFFF' : isVisited ? '#78350F' : '#0369A1';
          const weight = isSelected ? 3.5 : 2;

          return (
            <React.Fragment key={island.id}>
              {isSelected && (
                <CircleMarker
                  center={[lat, lng]}
                  radius={24}
                  pathOptions={{ fillColor: '#EC4899', fillOpacity: 0.3, color: '#EC4899', weight: 1.5, dashArray: '5,5' }}
                />
              )}
              <CircleMarker
                center={[lat, lng]}
                radius={radius}
                pathOptions={{ fillColor, fillOpacity: 1, color: borderColor, weight }}
                eventHandlers={{
                  click: () => {
                    onSelectIsland(island);
                  }
                }}
              >
                <Tooltip direction="top" offset={[0, -8]} permanent={isSelected}>
                  <span className="font-serif text-xs font-bold text-slate-900 flex items-center gap-1">
                    {isVisited ? '👑 ' : isSelected ? '🎯 ' : '🏝️ '}
                    {island.name} ({island.prefecture})
                  </span>
                </Tooltip>
              </CircleMarker>
            </React.Fragment>
          );
        })}
      </MapContainer>

      {/* マップ右上のスタイル切り替え・帰属表示タグ */}
      <div className="absolute top-4 right-4 z-[1000] bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-[0.65rem] font-mono text-indigo-300 flex items-center gap-2 pointer-events-none">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>ESRI SATELLITE & FLIGHT ENGINE</span>
      </div>
    </div>
  );
}
