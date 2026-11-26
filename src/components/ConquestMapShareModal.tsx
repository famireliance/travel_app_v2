'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Download, Map as MapIcon, Share2, Sparkles, Smartphone, Monitor, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { ALL_ISLANDS_MASTER_DICTIONARY } from '@/data/allIslandsMaster';
import { useTravel } from '@/context/TravelContext';
import { getIslandDifficulty } from '@/lib/difficulty';
import { getPlayerLevelInfo } from '@/lib/gamification';

export type ShareAspectMode = 'landscape' | 'story';

interface ConquestMapShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAspect?: ShareAspectMode;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const CONQUEST_TARGET_ISLANDS: any[] = Object.values(ALL_ISLANDS_MASTER_DICTIONARY).filter(
  (i) => i.is_conquest_target !== false && i.is_published !== false
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseIslandLatLng(island: any): { lat: number; lng: number } | null {
  if (!island) return null;
  if (typeof island.lat === 'number' && typeof island.lng === 'number' && !isNaN(island.lat) && !isNaN(island.lng)) {
    return { lat: island.lat, lng: island.lng };
  }
  if (
    typeof island.latitude === 'number' &&
    typeof island.longitude === 'number' &&
    !isNaN(island.latitude) &&
    !isNaN(island.longitude)
  ) {
    return { lat: island.latitude, lng: island.longitude };
  }
  if (typeof island.coordinates === 'string') {
    const parts = island.coordinates.split(',');
    if (parts.length >= 2) {
      const lat = parseFloat(parts[0].trim());
      const lng = parseFloat(parts[1].trim());
      if (!isNaN(lat) && !isNaN(lng)) {
        return { lat, lng };
      }
    }
  }
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isConquestIslandVisited(island: any, islandStatuses: Record<string, string>): boolean {
  if (!island || !islandStatuses) return false;
  const byId = islandStatuses[String(island.id)];
  if (byId === 'visited' || byId === 'verified_visited') return true;
  if (island.slug) {
    const bySlug = islandStatuses[String(island.slug)];
    if (bySlug === 'visited' || bySlug === 'verified_visited') return true;
  }
  return false;
}

/**
 * 離島偏差値カーブ:
 * 0島=38, 1島=44, 3島=50, 10島=58, 30島=67, 100島=78, 417島=99
 */
export function calculateIslandDeviation(visitedCount: number): number {
  const count = Math.max(0, visitedCount);
  const anchors: [number, number][] = [
    [0, 38],
    [1, 44],
    [3, 50],
    [10, 58],
    [30, 67],
    [100, 78],
    [220, 89],
    [417, 99],
  ];
  if (count >= anchors[anchors.length - 1][0]) return 99;
  for (let i = 0; i < anchors.length - 1; i++) {
    const [x0, y0] = anchors[i];
    const [x1, y1] = anchors[i + 1];
    if (count >= x0 && count <= x1) {
      const ratio = x1 === x0 ? 0 : (count - x0) / (x1 - x0);
      return Math.round(y0 + ratio * (y1 - y0));
    }
  }
  return 38;
}

export function getTravelerRank(visitedCount: number): {
  rank: 'S' | 'A' | 'B' | 'C' | 'D';
  label: string;
  colorHex: string;
  badgeClass: string;
} {
  if (visitedCount >= 30) {
    return {
      rank: 'S',
      label: '離島レジェンド',
      colorHex: '#FBBF24',
      badgeClass: 'bg-amber-400/20 text-amber-300 border-amber-400/50',
    };
  }
  if (visitedCount >= 10) {
    return {
      rank: 'A',
      label: '熟練アイランダー',
      colorHex: '#34D399',
      badgeClass: 'bg-emerald-400/20 text-emerald-300 border-emerald-400/50',
    };
  }
  if (visitedCount >= 3) {
    return {
      rank: 'B',
      label: '島旅ウォーカー',
      colorHex: '#38BDF8',
      badgeClass: 'bg-sky-400/20 text-sky-300 border-sky-400/50',
    };
  }
  if (visitedCount >= 1) {
    return {
      rank: 'C',
      label: '島旅ビギナー',
      colorHex: '#A78BFA',
      badgeClass: 'bg-violet-400/20 text-violet-300 border-violet-400/50',
    };
  }
  return {
    rank: 'D',
    label: 'これから初出航',
    colorHex: '#94A3B8',
    badgeClass: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
  };
}

function getShortIslandName(rawName?: string): string {
  if (!rawName) return '離島';
  const base = String(rawName).replace(/（.*?）|\(.*?\)/g, '').trim();
  if (base.includes('・')) {
    const parts = base.split('・').filter(Boolean);
    return parts[parts.length - 1] || base;
  }
  return base;
}

// Module-scoped TopoJSON coastline ring cache ([lng, lat][][])
let cachedCoastlineRings: number[][][] | null = null;
let coastlineFetchPromise: Promise<number[][][]> | null = null;

// Compact, dependency-free TopoJSON outer-ring decoder
function decodeTopoJsonRings(topo: {
  transform?: { scale: [number, number]; translate: [number, number] };
  arcs?: number[][][];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  objects?: Record<string, any>;
}): number[][][] {
  if (!topo?.arcs || !topo?.objects) return [];
  const scale = topo.transform?.scale || [1, 1];
  const translate = topo.transform?.translate || [0, 0];

  const decodedArcs: [number, number][][] = topo.arcs.map((arc) => {
    let x = 0;
    let y = 0;
    return arc.map(([dx, dy]) => {
      x += dx;
      y += dy;
      return [x * scale[0] + translate[0], y * scale[1] + translate[1]];
    });
  });

  const buildRing = (arcIndices: number[]): number[][] => {
    const ring: number[][] = [];
    for (let i = 0; i < arcIndices.length; i++) {
      const idx = arcIndices[i];
      const pts = idx >= 0 ? decodedArcs[idx] : decodedArcs[~idx]?.slice().reverse();
      if (!pts) continue;
      for (let j = i === 0 ? 0 : 1; j < pts.length; j++) {
        ring.push(pts[j]);
      }
    }
    return ring;
  };

  const rings: number[][][] = [];
  const objKey = Object.keys(topo.objects)[0];
  const geometries = topo.objects[objKey]?.geometries || [];
  for (const geom of geometries) {
    if (geom.type === 'Polygon' && Array.isArray(geom.arcs) && geom.arcs[0]) {
      const r = buildRing(geom.arcs[0]);
      if (r.length >= 3) rings.push(r);
    } else if (geom.type === 'MultiPolygon' && Array.isArray(geom.arcs)) {
      for (const poly of geom.arcs) {
        if (poly && poly[0]) {
          const r = buildRing(poly[0]);
          if (r.length >= 3) rings.push(r);
        }
      }
    }
  }
  return rings;
}

function loadJapanCoastlineRings(): Promise<number[][][]> {
  if (cachedCoastlineRings) return Promise.resolve(cachedCoastlineRings);
  if (coastlineFetchPromise) return coastlineFetchPromise;
  coastlineFetchPromise = fetch('/japan.topojson')
    .then((res) => (res.ok ? res.json() : null))
    .then((json) => {
      if (!json) return [];
      const rings = decodeTopoJsonRings(json);
      if (rings.length > 0) cachedCoastlineRings = rings;
      return rings;
    })
    .catch(() => []);
  return coastlineFetchPromise;
}

interface MapViewportBox {
  x: number;
  y: number;
  w: number;
  h: number;
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
  pad?: number;
}

function createBoxProjector(box: MapViewportBox) {
  const pad = box.pad ?? 12;
  const midLatRad = ((box.minLat + box.maxLat) / 2) * (Math.PI / 180);
  const cosLat = Math.cos(midLatRad);
  const geoW = (box.maxLng - box.minLng) * cosLat;
  const geoH = box.maxLat - box.minLat;
  const availW = Math.max(10, box.w - pad * 2);
  const availH = Math.max(10, box.h - pad * 2);
  const scale = Math.min(availW / geoW, availH / geoH);
  const drawnW = geoW * scale;
  const drawnH = geoH * scale;
  const offsetX = box.x + (box.w - drawnW) / 2;
  const offsetY = box.y + (box.h - drawnH) / 2;

  return (lat: number, lng: number): [number, number] => [
    offsetX + (lng - box.minLng) * cosLat * scale,
    offsetY + (box.maxLat - lat) * scale,
  ];
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawMapViewport(
  ctx: CanvasRenderingContext2D,
  box: MapViewportBox,
  rings: number[][][],
  points: { lat: number; lng: number; visited: boolean }[],
  options: {
    isInset?: boolean;
    title?: string;
    unvisitedRadius: number;
    visitedRadius: number;
  }
) {
  const project = createBoxProjector(box);

  ctx.save();
  drawRoundedRect(ctx, box.x, box.y, box.w, box.h, options.isInset ? 14 : 20);
  if (options.isInset) {
    ctx.fillStyle = 'rgba(4, 12, 26, 0.94)';
    ctx.fill();
  }
  ctx.clip();

  // Subtle nautical graticule lines
  ctx.strokeStyle = options.isInset ? 'rgba(56, 189, 248, 0.08)' : 'rgba(56, 189, 248, 0.065)';
  ctx.lineWidth = 1;
  const latStep = options.isInset ? 2 : 5;
  const lngStep = options.isInset ? 2 : 5;

  for (let lat = Math.ceil(box.minLat / latStep) * latStep; lat <= box.maxLat; lat += latStep) {
    const [, py] = project(lat, box.minLng);
    ctx.beginPath();
    ctx.moveTo(box.x, py);
    ctx.lineTo(box.x + box.w, py);
    ctx.stroke();
  }
  for (let lng = Math.ceil(box.minLng / lngStep) * lngStep; lng <= box.maxLng; lng += lngStep) {
    const [px] = project(box.minLat, lng);
    ctx.beginPath();
    ctx.moveTo(px, box.y);
    ctx.lineTo(px, box.y + box.h);
    ctx.stroke();
  }

  // Coastline polygons from japan.topojson
  if (rings.length > 0) {
    ctx.fillStyle = 'rgba(15, 36, 68, 0.92)';
    ctx.strokeStyle = 'rgba(125, 211, 252, 0.28)';
    ctx.lineWidth = options.isInset ? 1.0 : 1.15;

    for (const ring of rings) {
      // Quick bounding box cull
      let rMinLat = 90,
        rMaxLat = -90,
        rMinLng = 180,
        rMaxLng = -180;
      for (let i = 0; i < ring.length; i++) {
        const [lng, lat] = ring[i];
        if (lat < rMinLat) rMinLat = lat;
        if (lat > rMaxLat) rMaxLat = lat;
        if (lng < rMinLng) rMinLng = lng;
        if (lng > rMaxLng) rMaxLng = lng;
      }
      if (
        rMaxLat < box.minLat - 0.5 ||
        rMinLat > box.maxLat + 0.5 ||
        rMaxLng < box.minLng - 0.5 ||
        rMinLng > box.maxLng + 0.5
      ) {
        continue;
      }

      ctx.beginPath();
      for (let i = 0; i < ring.length; i++) {
        const [lng, lat] = ring[i];
        const [px, py] = project(lat, lng);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }

  // Filter islands inside this viewport
  const inBounds = points.filter(
    (p) =>
      p.lat >= box.minLat &&
      p.lat <= box.maxLat &&
      p.lng >= box.minLng &&
      p.lng <= box.maxLng
  );

  // 1) Unvisited islands (crisp subtle cyan/slate dots)
  for (const pt of inBounds) {
    if (pt.visited) continue;
    const [px, py] = project(pt.lat, pt.lng);
    ctx.beginPath();
    ctx.arc(px, py, options.unvisitedRadius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(148, 163, 184, 0.42)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.22)';
    ctx.lineWidth = 0.7;
    ctx.stroke();
  }

  // 2) Visited islands (Gold & Emerald glowing beacons with soft outer halo)
  for (const pt of inBounds) {
    if (!pt.visited) continue;
    const [px, py] = project(pt.lat, pt.lng);
    const haloR = options.visitedRadius * 3.2;

    const halo = ctx.createRadialGradient(px, py, 0, px, py, haloR);
    halo.addColorStop(0, 'rgba(253, 224, 71, 0.95)');
    halo.addColorStop(0.32, 'rgba(16, 185, 129, 0.65)');
    halo.addColorStop(0.65, 'rgba(245, 158, 11, 0.25)');
    halo.addColorStop(1, 'rgba(16, 185, 129, 0)');
    ctx.beginPath();
    ctx.arc(px, py, haloR, 0, Math.PI * 2);
    ctx.fillStyle = halo;
    ctx.fill();

    // Emerald-gold ring
    ctx.beginPath();
    ctx.arc(px, py, options.visitedRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#10B981';
    ctx.fill();
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = '#FBBF24';
    ctx.stroke();

    // Bright gold-white beacon core
    ctx.beginPath();
    ctx.arc(px, py, options.visitedRadius * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = '#FEF9C3';
    ctx.fill();
  }

  // Inset title label
  if (options.isInset && options.title) {
    ctx.font = 'bold 12px "Hiragino Sans", "Noto Sans JP", sans-serif';
    const textW = ctx.measureText(options.title).width;
    drawRoundedRect(ctx, box.x + 8, box.y + 8, textW + 18, 22, 6);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.35)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#FDE68A';
    ctx.textBaseline = 'middle';
    ctx.fillText(options.title, box.x + 17, box.y + 19);
  }

  ctx.restore();

  // Outer border for box
  ctx.save();
  drawRoundedRect(ctx, box.x, box.y, box.w, box.h, options.isInset ? 14 : 20);
  ctx.strokeStyle = options.isInset ? 'rgba(251, 191, 36, 0.45)' : 'rgba(56, 189, 248, 0.22)';
  ctx.lineWidth = options.isInset ? 1.5 : 1.2;
  ctx.stroke();
  ctx.restore();
}

export default function ConquestMapShareModal({
  isOpen,
  onClose,
  initialAspect = 'landscape',
}: ConquestMapShareModalProps) {
  const { islandStatuses, travelerName, totalXP, totalPoints } = useTravel();
  const [aspect, setAspect] = useState<ShareAspectMode>(initialAspect);
  const [coastRings, setCoastRings] = useState<number[][][]>(() => cachedCoastlineRings || []);
  const [previewDataUrl, setPreviewDataUrl] = useState<string>('');
  const [cachedFile, setCachedFile] = useState<File | null>(null);
  const [cachedBlobUrl, setCachedBlobUrl] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    loadJapanCoastlineRings().then((rings) => {
      if (active && rings.length > 0) {
        setCoastRings(rings);
      }
    });
    return () => {
      active = false;
    };
  }, [isOpen]);

  const stats = useMemo(() => {
    const targetTotal = CONQUEST_TARGET_ISLANDS.length || 417;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const visitedIslands: any[] = [];
    const mapPoints: { lat: number; lng: number; visited: boolean }[] = [];

    for (const isl of CONQUEST_TARGET_ISLANDS) {
      const visited = isConquestIslandVisited(isl, islandStatuses);
      if (visited) visitedIslands.push(isl);
      const coords = parseIslandLatLng(isl);
      if (coords) {
        mapPoints.push({ lat: coords.lat, lng: coords.lng, visited });
      }
    }

    const visitedCount = visitedIslands.length;
    const pct = targetTotal > 0 ? (visitedCount / targetTotal) * 100 : 0;
    const deviation = calculateIslandDeviation(visitedCount);
    const rankInfo = getTravelerRank(visitedCount);
    const effectiveXP = Math.max(totalXP || 0, totalPoints || 0, visitedCount * 100);
    const lvInfo = getPlayerLevelInfo(effectiveXP);

    let highestDiffText = 'これから初上陸！';
    if (visitedIslands.length > 0) {
      const sorted = [...visitedIslands].sort((a, b) => {
        const da = getIslandDifficulty(a).level;
        const db = getIslandDifficulty(b).level;
        if (db !== da) return db - da;
        return (Number(b.points) || 0) - (Number(a.points) || 0);
      });
      const topIsland = sorted[0];
      const diff = getIslandDifficulty(topIsland);
      const tierWord =
        diff.level >= 5
          ? '絶海'
          : diff.level === 4
          ? '秘境'
          : diff.level === 3
          ? '冒険'
          : diff.level === 2
          ? '沿岸'
          : '架橋';
      const stars =
        '★'.repeat(Math.max(1, diff.level)) + '☆'.repeat(Math.max(0, 5 - Math.max(1, diff.level)));
      highestDiffText = `${stars} ${tierWord}（${getShortIslandName(topIsland.name)}）`;
    }

    return {
      targetTotal,
      visitedCount,
      pctStr: pct.toFixed(1),
      pct,
      deviation,
      rankInfo,
      lvInfo,
      highestDiffText,
      mapPoints,
      displayName: (travelerName || '島旅トラベラー').trim() || '島旅トラベラー',
    };
  }, [islandStatuses, travelerName, totalXP, totalPoints]);

  // Draw HTML5 Canvas & pre-cache PNG File + Blob + DataURL immediately (zero await on user tap!)
  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = aspect === 'landscape' ? 1200 : 1080;
    const height = aspect === 'landscape' ? 630 : 1920;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Deep ocean background gradient
    const bgGrad = ctx.createRadialGradient(
      width * 0.62,
      height * 0.45,
      40,
      width * 0.5,
      height * 0.5,
      Math.max(width, height) * 0.85
    );
    bgGrad.addColorStop(0, '#0B2144');
    bgGrad.addColorStop(0.55, '#061226');
    bgGrad.addColorStop(1, '#020611');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Luxury outer frame
    ctx.save();
    drawRoundedRect(ctx, 14, 14, width - 28, height - 28, 24);
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.34)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    const fontSans = '"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif';
    const fontSerif = '"Hiragino Mincho ProN", "Yu Mincho", "Noto Serif JP", serif';

    if (aspect === 'landscape') {
      // === LANDSCAPE (1200 x 630) ===
      // Map on Right: x=478..1174, y=28..602
      const mainBox: MapViewportBox = {
        x: 478,
        y: 28,
        w: 696,
        h: 574,
        minLat: 29.95,
        maxLat: 45.7,
        minLng: 128.5,
        maxLng: 146.0,
        pad: 16,
      };
      const okinawaInset: MapViewportBox = {
        x: 492,
        y: 42,
        w: 270,
        h: 215,
        minLat: 24.0,
        maxLat: 30.05,
        minLng: 122.8,
        maxLng: 131.5,
        pad: 12,
      };
      const ogasawaraInset: MapViewportBox = {
        x: 966,
        y: 344,
        w: 194,
        h: 244,
        minLat: 24.2,
        maxLat: 34.9,
        minLng: 138.8,
        maxLng: 142.5,
        pad: 12,
      };

      drawMapViewport(ctx, mainBox, coastRings, stats.mapPoints, {
        unvisitedRadius: 2.3,
        visitedRadius: 5.0,
      });
      drawMapViewport(ctx, okinawaInset, coastRings, stats.mapPoints, {
        isInset: true,
        title: '南西諸島・沖縄・奄美拡大',
        unvisitedRadius: 2.2,
        visitedRadius: 4.8,
      });
      drawMapViewport(ctx, ogasawaraInset, coastRings, stats.mapPoints, {
        isInset: true,
        title: '伊豆・小笠原諸島',
        unvisitedRadius: 2.2,
        visitedRadius: 4.8,
      });

      // Left HUD Panel
      ctx.save();
      drawRoundedRect(ctx, 28, 28, 434, 574, 20);
      ctx.fillStyle = 'rgba(6, 14, 30, 0.88)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.32)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.restore();

      // Header Tag & Title
      ctx.fillStyle = '#38BDF8';
      ctx.font = `bold 11px ${fontSans}`;
      ctx.textBaseline = 'top';
      ctx.fillText('NATIONAL ISLAND CONQUEST CHART', 52, 50);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold 24px ${fontSerif}`;
      ctx.fillText('KIRATABI 日本全国・離島制覇マップ', 52, 72);

      // Traveler Name + Level
      ctx.fillStyle = '#E2E8F0';
      ctx.font = `bold 16px ${fontSans}`;
      const travText = `🧭 ${stats.displayName.slice(0, 14)}`;
      ctx.fillText(travText, 52, 114);

      const lvBadgeText = `Lv.${stats.lvInfo.level} ${stats.lvInfo.title}`;
      ctx.font = `bold 12px ${fontSans}`;
      const lvW = Math.min(230, ctx.measureText(lvBadgeText).width + 20);
      drawRoundedRect(ctx, 52, 142, lvW, 24, 12);
      ctx.fillStyle = 'rgba(59, 130, 246, 0.22)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(96, 165, 250, 0.45)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = '#93C5FD';
      ctx.textBaseline = 'middle';
      ctx.fillText(lvBadgeText, 62, 154);

      // Hero Metric Box
      drawRoundedRect(ctx, 52, 180, 386, 136, 16);
      ctx.fillStyle = 'rgba(15, 28, 54, 0.92)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.textBaseline = 'top';
      ctx.fillStyle = '#FCD34D';
      ctx.font = `bold 12px ${fontSans}`;
      ctx.fillText('制覇離島数（有人離島・観光無人島 全417島）', 70, 196);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold 54px ${fontSerif}`;
      const countStr = String(stats.visitedCount);
      ctx.fillText(countStr, 70, 218);
      const countW = ctx.measureText(countStr).width;

      ctx.fillStyle = '#94A3B8';
      ctx.font = `bold 22px ${fontSans}`;
      ctx.fillText(`/ ${stats.targetTotal} 島`, 78 + countW, 244);

      ctx.fillStyle = '#34D399';
      ctx.font = `bold 16px ${fontSans}`;
      ctx.textAlign = 'right';
      ctx.fillText(`制覇率 ${stats.pctStr}%`, 420, 250);
      ctx.textAlign = 'left';

      // Progress bar
      drawRoundedRect(ctx, 70, 288, 350, 10, 5);
      ctx.fillStyle = 'rgba(30, 41, 59, 0.95)';
      ctx.fill();
      const fillW = Math.max(stats.visitedCount > 0 ? 10 : 0, Math.min(350, (stats.pct / 100) * 350));
      if (fillW > 0) {
        const barGrad = ctx.createLinearGradient(70, 0, 420, 0);
        barGrad.addColorStop(0, '#F59E0B');
        barGrad.addColorStop(0.5, '#FDE047');
        barGrad.addColorStop(1, '#10B981');
        drawRoundedRect(ctx, 70, 288, fillW, 10, 5);
        ctx.fillStyle = barGrad;
        ctx.fill();
      }

      // 2-Col: Deviation & Rank
      drawRoundedRect(ctx, 52, 330, 186, 102, 14);
      ctx.fillStyle = 'rgba(15, 28, 54, 0.85)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
      ctx.stroke();

      ctx.fillStyle = '#94A3B8';
      ctx.font = `bold 12px ${fontSans}`;
      ctx.fillText('推定・離島偏差値', 68, 344);
      ctx.fillStyle = '#38BDF8';
      ctx.font = `bold 44px ${fontSerif}`;
      ctx.fillText(String(stats.deviation), 68, 368);

      drawRoundedRect(ctx, 252, 330, 186, 102, 14);
      ctx.fillStyle = 'rgba(15, 28, 54, 0.85)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.35)';
      ctx.stroke();

      ctx.fillStyle = '#94A3B8';
      ctx.font = `bold 12px ${fontSans}`;
      ctx.fillText('旅人ランク', 268, 344);
      ctx.fillStyle = stats.rankInfo.colorHex;
      ctx.font = `bold 44px ${fontSerif}`;
      ctx.fillText(stats.rankInfo.rank, 268, 368);
      ctx.fillStyle = '#E2E8F0';
      ctx.font = `bold 12px ${fontSans}`;
      ctx.fillText(stats.rankInfo.label, 312, 392);

      // Highest Difficulty
      drawRoundedRect(ctx, 52, 446, 386, 68, 14);
      ctx.fillStyle = 'rgba(15, 28, 54, 0.85)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.3)';
      ctx.stroke();

      ctx.fillStyle = '#94A3B8';
      ctx.font = `bold 11px ${fontSans}`;
      ctx.fillText('最高到達難易度', 68, 460);
      ctx.fillStyle = '#FDE68A';
      ctx.font = `bold 17px ${fontSans}`;
      ctx.fillText(stats.highestDiffText, 68, 482);

      // Map Legend
      ctx.beginPath();
      ctx.arc(62, 536, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#10B981';
      ctx.fill();
      ctx.strokeStyle = '#FBBF24';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#E2E8F0';
      ctx.font = `bold 12px ${fontSans}`;
      ctx.textBaseline = 'middle';
      ctx.fillText('制覇済みの離島', 74, 536);

      ctx.beginPath();
      ctx.arc(186, 536, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(148, 163, 184, 0.65)';
      ctx.fill();
      ctx.fillStyle = '#94A3B8';
      ctx.fillText('未踏の離島', 197, 536);

      // Watermark
      ctx.fillStyle = '#CBD5E1';
      ctx.font = `bold 11.5px ${fontSans}`;
      ctx.fillText('輝旅 島専科 | island.kira-tabi.com', 52, 568);
      ctx.fillStyle = '#FBBF24';
      ctx.font = `bold 11.5px ${fontSans}`;
      ctx.fillText('#離島制覇マップ #キラ旅', 52, 586);
    } else {
      // === STORY / WALLPAPER (1080 x 1920) ===
      // Top Title & Traveler Header
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = '#38BDF8';
      ctx.font = `bold 18px ${fontSans}`;
      ctx.fillText('NATIONAL ISLAND CONQUEST CHART', width / 2, 56);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold 42px ${fontSerif}`;
      ctx.fillText('KIRATABI 日本全国・離島制覇マップ', width / 2, 90);

      const subTitle = `🧭 ${stats.displayName.slice(0, 16)}  ｜  Lv.${stats.lvInfo.level} ${stats.lvInfo.title}`;
      ctx.fillStyle = '#E2E8F0';
      ctx.font = `bold 24px ${fontSans}`;
      ctx.fillText(subTitle, width / 2, 154);
      ctx.textAlign = 'left';

      // Top Stats Dashboard Box (y=210..530)
      drawRoundedRect(ctx, 48, 210, 984, 316, 24);
      ctx.fillStyle = 'rgba(7, 16, 34, 0.9)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#FCD34D';
      ctx.font = `bold 20px ${fontSans}`;
      ctx.fillText('制覇離島数（日本全国 上陸制覇対象 全417島）', 84, 236);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold 84px ${fontSerif}`;
      const cStr = String(stats.visitedCount);
      ctx.fillText(cStr, 84, 266);
      const cW = ctx.measureText(cStr).width;

      ctx.fillStyle = '#94A3B8';
      ctx.font = `bold 34px ${fontSans}`;
      ctx.fillText(`/ ${stats.targetTotal} 島`, 98 + cW, 306);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#34D399';
      ctx.font = `bold 32px ${fontSans}`;
      ctx.fillText(`制覇率 ${stats.pctStr}%`, 996, 308);
      ctx.textAlign = 'left';

      // Progress Bar
      drawRoundedRect(ctx, 84, 368, 912, 16, 8);
      ctx.fillStyle = 'rgba(30, 41, 59, 0.95)';
      ctx.fill();
      const sFillW = Math.max(stats.visitedCount > 0 ? 18 : 0, Math.min(912, (stats.pct / 100) * 912));
      if (sFillW > 0) {
        const barGrad = ctx.createLinearGradient(84, 0, 996, 0);
        barGrad.addColorStop(0, '#F59E0B');
        barGrad.addColorStop(0.5, '#FDE047');
        barGrad.addColorStop(1, '#10B981');
        drawRoundedRect(ctx, 84, 368, sFillW, 16, 8);
        ctx.fillStyle = barGrad;
        ctx.fill();
      }

      // 3 Stat Subcards inside Dashboard
      // 1. Deviation
      drawRoundedRect(ctx, 84, 404, 240, 100, 16);
      ctx.fillStyle = 'rgba(15, 30, 58, 0.9)';
      ctx.fill();
      ctx.fillStyle = '#94A3B8';
      ctx.font = `bold 16px ${fontSans}`;
      ctx.fillText('離島偏差値', 106, 420);
      ctx.fillStyle = '#38BDF8';
      ctx.font = `bold 46px ${fontSerif}`;
      ctx.fillText(String(stats.deviation), 106, 446);

      // 2. Rank
      drawRoundedRect(ctx, 342, 404, 260, 100, 16);
      ctx.fillStyle = 'rgba(15, 30, 58, 0.9)';
      ctx.fill();
      ctx.fillStyle = '#94A3B8';
      ctx.font = `bold 16px ${fontSans}`;
      ctx.fillText('旅人ランク', 364, 420);
      ctx.fillStyle = stats.rankInfo.colorHex;
      ctx.font = `bold 46px ${fontSerif}`;
      ctx.fillText(stats.rankInfo.rank, 364, 446);
      ctx.fillStyle = '#E2E8F0';
      ctx.font = `bold 16px ${fontSans}`;
      ctx.fillText(stats.rankInfo.label, 412, 466);

      // 3. Highest Difficulty
      drawRoundedRect(ctx, 620, 404, 376, 100, 16);
      ctx.fillStyle = 'rgba(15, 30, 58, 0.9)';
      ctx.fill();
      ctx.fillStyle = '#94A3B8';
      ctx.font = `bold 16px ${fontSans}`;
      ctx.fillText('最高到達難易度', 642, 420);
      ctx.fillStyle = '#FDE68A';
      ctx.font = `bold 22px ${fontSans}`;
      ctx.fillText(stats.highestDiffText, 642, 456);

      // Center Giant Map Area (y=550..1740)
      const storyMainBox: MapViewportBox = {
        x: 48,
        y: 552,
        w: 984,
        h: 1184,
        minLat: 29.95,
        maxLat: 45.7,
        minLng: 128.5,
        maxLng: 146.0,
        pad: 24,
      };
      const storyOkinawaInset: MapViewportBox = {
        x: 68,
        y: 572,
        w: 410,
        h: 350,
        minLat: 24.0,
        maxLat: 30.05,
        minLng: 122.8,
        maxLng: 131.5,
        pad: 16,
      };
      const storyOgasawaraInset: MapViewportBox = {
        x: 716,
        y: 1310,
        w: 296,
        h: 406,
        minLat: 24.2,
        maxLat: 34.9,
        minLng: 138.8,
        maxLng: 142.5,
        pad: 16,
      };

      drawMapViewport(ctx, storyMainBox, coastRings, stats.mapPoints, {
        unvisitedRadius: 3.2,
        visitedRadius: 7.2,
      });
      drawMapViewport(ctx, storyOkinawaInset, coastRings, stats.mapPoints, {
        isInset: true,
        title: '南西諸島・沖縄・奄美拡大',
        unvisitedRadius: 3.0,
        visitedRadius: 6.8,
      });
      drawMapViewport(ctx, storyOgasawaraInset, coastRings, stats.mapPoints, {
        isInset: true,
        title: '伊豆・小笠原諸島',
        unvisitedRadius: 3.0,
        visitedRadius: 6.8,
      });

      // Legend & Footer Watermark
      ctx.textBaseline = 'middle';
      ctx.beginPath();
      ctx.arc(84, 1782, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#10B981';
      ctx.fill();
      ctx.strokeStyle = '#FBBF24';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#E2E8F0';
      ctx.font = `bold 20px ${fontSans}`;
      ctx.fillText('制覇済みの離島（Gold & Emerald Beacon）', 104, 1782);

      ctx.beginPath();
      ctx.arc(540, 1782, 5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(148, 163, 184, 0.65)';
      ctx.fill();
      ctx.fillStyle = '#94A3B8';
      ctx.fillText('未踏の離島', 556, 1782);

      ctx.textAlign = 'center';
      ctx.fillStyle = '#E2E8F0';
      ctx.font = `bold 22px ${fontSans}`;
      ctx.fillText(
        '輝旅 島専科 | island.kira-tabi.com   #離島制覇マップ #キラ旅',
        width / 2,
        1844
      );
      ctx.textAlign = 'left';
    }

    // Synchronously capture DataURL and pre-generate PNG File/Blob (zero await on click!)
    const dataUrl = canvas.toDataURL('image/png');
    setPreviewDataUrl(dataUrl);

    let prevBlobUrl = '';
    canvas.toBlob((blob) => {
      if (!blob) return;
      const fileName = `kiratabi-conquest-map-${aspect}-${stats.visitedCount}.png`;
      const file = new File([blob], fileName, { type: 'image/png' });
      const url = URL.createObjectURL(blob);
      prevBlobUrl = url;
      setCachedFile(file);
      setCachedBlobUrl((old) => {
        if (old) URL.revokeObjectURL(old);
        return url;
      });
    }, 'image/png');

    return () => {
      if (prevBlobUrl) {
        URL.revokeObjectURL(prevBlobUrl);
      }
    };
  }, [isOpen, aspect, coastRings, stats]);

  if (!isOpen) return null;

  const fileName = `kiratabi-conquest-map-${aspect}-${stats.visitedCount}.png`;
  const shareTweetText = `🏝️ 私の日本全国・離島制覇マップ！\n制覇離島数: ${stats.visitedCount} / ${stats.targetTotal}島（制覇率 ${stats.pctStr}%）\n離島偏差値: ${stats.deviation} ｜ 旅人ランク: ${stats.rankInfo.rank}\n最高到達難易度: ${stats.highestDiffText}\n\n30秒であなたの離島偏差値＆制覇マップも診断👇\n#離島制覇マップ #キラ旅`;

  const handleDownloadPng = () => {
    const href = cachedBlobUrl || previewDataUrl;
    if (!href) return;
    const a = document.createElement('a');
    a.href = href;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('📥 離島制覇マップ画像をダウンロードしました！');
  };

  const handleNativeShare = () => {
    // Zero await before navigator.share to preserve iOS Safari transient user activation
    if (typeof navigator !== 'undefined' && navigator.share && cachedFile) {
      const canShareFiles =
        typeof navigator.canShare === 'function' ? navigator.canShare({ files: [cachedFile] }) : true;
      if (canShareFiles) {
        navigator
          .share({
            files: [cachedFile],
            title: 'KIRATABI 日本全国・離島制覇マップ',
            text: shareTweetText,
          })
          .catch((err) => {
            if (err?.name !== 'AbortError') {
              handleDownloadPng();
            }
          });
        return;
      }
    }
    handleDownloadPng();
  };

  const handleShareX = () => {
    const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      shareTweetText
    )}&url=${encodeURIComponent('https://island.kira-tabi.com')}`;
    window.open(xUrl, '_blank', 'noopener,noreferrer');
    toast('保存した制覇マップ画像を添付してポストするとさらに映えます！', { icon: '✨' });
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[10020] flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-2xl max-h-[92vh] bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-white"
        >
          {/* Header */}
          <div className="px-5 py-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h2 className="font-serif font-bold text-base sm:text-lg text-white truncate">
                  私の日本全国・離島制覇マップ
                </h2>
                <p className="text-[11px] text-slate-400 truncate">
                  全{stats.targetTotal}島プロット済 ｜ 偏差値 {stats.deviation}（ランク {stats.rankInfo.rank}）
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
              aria-label="閉じる"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
            {/* Aspect Ratio Toggle */}
            <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => setAspect('landscape')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  aspect === 'landscape'
                    ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Monitor className="w-4 h-4 shrink-0" />
                <span>横長（X / OGP最適）</span>
              </button>
              <button
                type="button"
                onClick={() => setAspect('story')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  aspect === 'story'
                    ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-4 h-4 shrink-0" />
                <span>縦長（Stories / 壁紙）</span>
              </button>
            </div>

            {/* Hidden Rendering Canvas */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Long-press Saveable Preview Image */}
            <div className="bg-slate-950 rounded-2xl p-2.5 border border-slate-800 flex flex-col items-center">
              {previewDataUrl ? (
                <img
                  src={previewDataUrl}
                  alt="私の日本全国・離島制覇マップ"
                  className={`rounded-xl shadow-xl border border-slate-800/80 select-auto ${
                    aspect === 'story' ? 'max-h-[44vh] w-auto' : 'w-full h-auto'
                  }`}
                />
              ) : (
                <div className="h-56 flex items-center justify-center text-xs text-slate-400">
                  制覇マップを描画中...
                </div>
              )}
              <p className="text-[11px] text-amber-300/90 mt-2 text-center font-medium">
                📱 スマホの方は上の画像を長押しして「&ldquo;写真&rdquo;に保存」もできます
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleNativeShare}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-emerald-400 hover:from-amber-300 hover:to-emerald-300 text-slate-950 font-extrabold text-sm shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-[0.99]"
              >
                <Share2 className="w-4 h-4 shrink-0" />
                <span>📲 写真アプリに保存 / 共有（iPhone・Android推奨）</span>
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={handleDownloadPng}
                  className="py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <Download className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>📥 PNG画像をダウンロード</span>
                </button>

                <button
                  type="button"
                  onClick={handleShareX}
                  className="py-3 px-4 rounded-2xl bg-black hover:bg-slate-950 border border-slate-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <span>𝕏 ポストして自慢する</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

/**
 * Floating Header/Overlay Trigger for /map page
 */
export function MapConquestShareOverlay() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="fixed top-[12.2rem] left-3 sm:top-6 sm:left-auto sm:right-20 lg:right-28 z-[1005] pointer-events-auto">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-full bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 hover:from-slate-800 hover:to-indigo-900 text-amber-300 border border-amber-400/50 shadow-[0_8px_28px_rgba(0,0,0,0.28)] font-bold text-xs flex items-center gap-1.5 transition-all hover:scale-105"
        >
          <MapIcon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>🗺️ 制覇マップ画像を作る</span>
        </button>
      </div>
      <ConquestMapShareModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
