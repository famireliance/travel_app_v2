'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { COLLAB_SPOTS, calculateDistance, CollabSpot } from '@/lib/spots';
import { useTravel } from '@/context/TravelContext';
import { MapPin, AlertCircle, CheckCircle2, ShieldAlert, Loader2, Navigation } from 'lucide-react';
import { motion } from 'framer-motion';

function CheckinContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const spotId = searchParams.get('spot_id');
  const { addSpotVisit } = useTravel();

  const [spot, setSpot] = useState<CollabSpot | null>(null);
  const [status, setStatus] = useState<'idle' | 'locating' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [distanceInfo, setDistanceInfo] = useState<number | null>(null);

  useEffect(() => {
    if (spotId) {
      const found = COLLAB_SPOTS.find(s => s.id === spotId);
      if (found) setSpot(found);
    }
  }, [spotId]);

  const handleCheckin = () => {
    if (!spot) return;
    setStatus('locating');
    setErrorMessage('');

    if (!navigator.geolocation) {
      setStatus('error');
      setErrorMessage('お使いのブラウザは位置情報(GPS)に対応していません。');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const dist = calculateDistance(latitude, longitude, spot.coordinates.lat, spot.coordinates.lng);
        setDistanceInfo(Math.round(dist));

        if (dist <= spot.radius_m) {
          // Success!
          const success = addSpotVisit(spot.id);
          setStatus('success');
          if (!success) {
             // It returns false if already collected, but we can still say success and "already obtained"
             setErrorMessage('このスポットの限定妖精はすでに獲得済みです！');
          }
        } else {
          // Too far
          setStatus('error');
          setErrorMessage(`現在地から店舗まで約 ${Math.round(dist)}m 離れています。\n店舗の半径 ${spot.radius_m}m 以内に近づいてから再度お試しください。`);
        }
      },
      (error) => {
        setStatus('error');
        if (error.code === error.PERMISSION_DENIED) {
          setErrorMessage('位置情報の取得が許可されていません。ブラウザの設定で位置情報をオンにしてください。');
        } else {
          setErrorMessage('位置情報の取得に失敗しました。電波の良いところで再度お試しください。');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  if (!spotId || !spot) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <ShieldAlert className="w-16 h-16 text-rose-500 mb-4" />
        <h1 className="text-xl font-bold text-white mb-2">無効なQRコードです</h1>
        <p className="text-slate-400">対象のスポット情報が見つかりませんでした。</p>
        <button onClick={() => router.push('/')} className="mt-8 text-blue-400 font-bold">トップページへ戻る</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-white p-6 lg:p-12 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/4 -right-1/4 w-[600px] h-[600px] rounded-full bg-amber-900/20 blur-[100px]" />
        <div className="absolute bottom-1/4 -left-1/4 w-[600px] h-[600px] rounded-full bg-indigo-900/20 blur-[100px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 text-center shadow-2xl"
      >
        <div className="w-20 h-20 bg-slate-900 rounded-full mx-auto flex items-center justify-center border-4 border-amber-500/30 mb-6 shadow-[0_0_30px_rgba(245,158,11,0.3)]">
          <MapPin className="w-10 h-10 text-amber-400" />
        </div>

        <h1 className="text-sm font-bold text-amber-400 tracking-widest mb-2">COLLABORATION SPOT</h1>
        <h2 className="text-2xl font-bold text-white mb-4">{spot.name}</h2>
        <p className="text-sm text-slate-300 mb-8 leading-relaxed">
          {spot.description}
        </p>

        {status === 'idle' && (
          <button
            onClick={handleCheckin}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <Navigation className="w-5 h-5" />
            現在地を取得してチェックイン
          </button>
        )}

        {status === 'locating' && (
          <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/10 flex flex-col items-center">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin mb-4" />
            <p className="text-sm font-bold text-white">GPSで位置情報を確認中...</p>
            <p className="text-xs text-slate-400 mt-2">少々お待ちください</p>
          </div>
        )}

        {status === 'error' && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-rose-950/50 p-6 rounded-2xl border border-rose-500/30 flex flex-col items-center">
            <AlertCircle className="w-10 h-10 text-rose-400 mb-3" />
            <p className="text-sm font-bold text-white mb-2 text-left whitespace-pre-line leading-relaxed">
              {errorMessage}
            </p>
            <button
              onClick={() => setStatus('idle')}
              className="mt-4 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full text-xs font-bold transition-all"
            >
              もう一度試す
            </button>
          </motion.div>
        )}

        {status === 'success' && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-emerald-950/50 p-6 rounded-2xl border border-emerald-500/30 flex flex-col items-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-3" />
            <h3 className="text-lg font-bold text-emerald-300 mb-2">チェックイン成功！</h3>
            {errorMessage ? (
               <p className="text-xs text-slate-300">{errorMessage}</p>
            ) : (
               <p className="text-xs text-emerald-100">店舗限定のレア妖精を獲得しました！</p>
            )}
            
            <button
              onClick={() => router.push('/companion')}
              className="mt-6 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg transition-all"
            >
              図鑑へ見に行く
            </button>
          </motion.div>
        )}
      </motion.div>
      
      <p className="mt-8 text-xs text-slate-500 text-center max-w-sm">
        ※GPSの精度により数十メートルの誤差が生じる場合があります。店舗の敷地内に入ってからお試しください。
      </p>
    </div>
  );
}

export default function CheckinPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-white"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
      <CheckinContent />
    </Suspense>
  );
}
