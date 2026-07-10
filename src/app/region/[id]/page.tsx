'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Search, Compass } from 'lucide-react';
import regionsData from '../../../data/regions.json';
import MapClient from '@/components/Map/MapClient';

export default function RegionMap() {
  const params = useParams();
  const router = useRouter();
  const regionId = params.id as string;
  const region = regionsData.find(r => r.id === regionId) || regionsData[0];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [regionIslands, setRegionIslands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/islands?select=*&region_id=eq.${regionId}`, {
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      }
    })
      .then(res => res.json())
      .then(islands => {
        setRegionIslands(islands || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load map data", err);
        setLoading(false);
      });
  }, [regionId]);

  // Compute bounding box based on islands
  let bounds: [[number, number], [number, number]] | undefined;
  if (regionIslands.length > 0) {
    const validCoords = regionIslands
      .filter(i => i.coordinates)
      .map(i => {
        const [lat, lng] = i.coordinates.split(',').map(parseFloat);
        return { lat, lng };
      })
      .filter(c => !isNaN(c.lat) && !isNaN(c.lng));

    if (validCoords.length > 0) {
      const lats = validCoords.map(c => c.lat);
      const lngs = validCoords.map(c => c.lng);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);
      
      const padLat = Math.max(0.2, (maxLat - minLat) * 0.3);
      const padLng = Math.max(0.2, (maxLng - minLng) * 0.3);
      bounds = [[minLat - padLat, minLng - padLng], [maxLat + padLat, maxLng + padLng]];
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center text-slate-400 font-serif tracking-[0.2em] text-sm gap-4">
      <Compass className="w-8 h-8 animate-spin-slow opacity-50" strokeWidth={1} />
      <span>地図を展開中...</span>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#F8FAFC] overflow-hidden fixed inset-0 flex flex-col font-sans">
      
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-[1000] px-6 lg:px-12 pt-12 lg:pt-8 pb-6 flex items-center justify-between pointer-events-none">
        <button 
          onClick={() => router.push('/')} 
          className="w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-white/90 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-white flex items-center justify-center text-slate-800 hover:scale-105 transition-transform pointer-events-auto"
        >
          <ArrowLeft className="w-5 h-5 lg:w-6 lg:h-6" strokeWidth={1.5} />
        </button>
        
        <div className="text-center flex-1 mx-4 drop-shadow-md">
          <p className="text-[0.65rem] lg:text-xs text-slate-600 font-bold tracking-[0.3em] uppercase mb-1 drop-shadow-sm">{region.enName}</p>
          <h1 className="font-serif font-bold text-2xl lg:text-4xl text-slate-900 tracking-widest drop-shadow-sm">{region.name}</h1>
        </div>
        
        <button className="w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-white/90 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-white flex items-center justify-center text-slate-800 hover:scale-105 transition-transform pointer-events-auto">
          <Search className="w-5 h-5 lg:w-6 lg:h-6" strokeWidth={1.5} />
        </button>
      </header>

      {/* Map Area */}
      <div className="flex-1 relative w-full h-full z-0">
        <MapClient islands={regionIslands} bounds={bounds} />
      </div>
    </main>
  );
}
