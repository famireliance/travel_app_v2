'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, MapPin, CheckCircle2, AlertCircle, Camera, Navigation2, ShieldCheck, Info } from 'lucide-react';
import exifr from 'exifr';
import { calculateDistanceKm } from '@/lib/geo';
import { useTravel } from '@/context/TravelContext';

interface CheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  island: any;
}

export default function CheckInModal({ isOpen, onClose, island }: CheckInModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [resultStatus, setResultStatus] = useState<'idle' | 'success' | 'error' | 'no_gps'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [distanceInfo, setDistanceInfo] = useState<number | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { updateStatus } = useTravel();

  const handleSelfReport = () => {
    updateStatus(island.id, 'visited');
    onClose();
  };

  const processPhoto = async (file: File) => {
    setIsProcessing(true);
    setResultStatus('idle');
    setErrorMessage('');
    setDistanceInfo(null);

    try {
      // EXIF情報の解析 (GPS情報の抽出)
      const gpsData = await exifr.gps(file);

      if (!gpsData || typeof gpsData.latitude !== 'number' || typeof gpsData.longitude !== 'number') {
        setResultStatus('no_gps');
        setErrorMessage('写真からGPS（位置情報）データが見つかりませんでした。撮影時の位置情報付加設定がオンになっているか確認してください。');
        setIsProcessing(false);
        return;
      }

      const photoLat = gpsData.latitude;
      const photoLng = gpsData.longitude;

      if (!island.coordinates) {
        setResultStatus('error');
        setErrorMessage('島の座標データが設定されていないため判定できません。');
        setIsProcessing(false);
        return;
      }

      const [islandLatStr, islandLngStr] = island.coordinates.split(',').map((s: string) => s.trim());
      const islandLat = parseFloat(islandLatStr);
      const islandLng = parseFloat(islandLngStr);

      const distance = calculateDistanceKm(photoLat, photoLng, islandLat, islandLng);
      setDistanceInfo(distance);

      // 閾値: 15km以内なら公式認定到達
      if (distance <= 15) {
        setResultStatus('success');
        updateStatus(island.id, 'verified_visited');
        // 自動で閉じるタイマーをセットするか、ユーザーに手動で閉じさせるか。ここでは手動で結果を見せる
      } else {
        setResultStatus('error');
        setErrorMessage(`島の中心から ${distance.toFixed(1)}km 離れています（判定基準: 15km以内）。現地で撮影された写真か確認してください。`);
      }
    } catch (error) {
      console.error('EXIF parse error:', error);
      setResultStatus('error');
      setErrorMessage('写真データの解析中にエラーが発生しました。別の写真をお試しください。');
    } finally {
      setIsProcessing(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processPhoto(e.target.files[0]);
    }
  };

  const handleCurrentLocationCheckIn = () => {
    if (!navigator.geolocation) {
      setResultStatus('error');
      setErrorMessage('お使いのブラウザは位置情報機能（GPS）をサポートしていません。');
      return;
    }

    setIsLocating(true);
    setResultStatus('idle');
    setErrorMessage('');
    setDistanceInfo(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const { latitude: userLat, longitude: userLng } = position.coords;

        if (!island.coordinates) {
          setResultStatus('error');
          setErrorMessage('島の座標データが設定されていないため判定できません。');
          return;
        }

        const [islandLatStr, islandLngStr] = island.coordinates.split(',').map((s: string) => s.trim());
        const islandLat = parseFloat(islandLatStr);
        const islandLng = parseFloat(islandLngStr);

        const distance = calculateDistanceKm(userLat, userLng, islandLat, islandLng);
        setDistanceInfo(distance);

        if (distance <= 15) {
          setResultStatus('success');
          updateStatus(island.id, 'verified_visited');
        } else {
          setResultStatus('error');
          setErrorMessage(`現在地は島の中心から ${distance.toFixed(1)}km 離れています（判定基準: 15km以内）。`);
        }
      },
      (error) => {
        setIsLocating(false);
        setResultStatus('error');
        if (error.code === error.PERMISSION_DENIED) {
          setErrorMessage('位置情報の取得が許可されていません。ブラウザの設定で位置情報を許可してください。');
        } else {
          setErrorMessage('現在地の取得に失敗しました。電波状況の良い場所で再度お試しください。');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // 閉じる時のリセット処理
  const handleClose = () => {
    setResultStatus('idle');
    setErrorMessage('');
    setDistanceInfo(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="bg-slate-900 px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <ShieldCheck className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold tracking-widest text-sm">公式到達認定チェックイン</h3>
              </div>
              <button onClick={handleClose} className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 md:p-8">
              <div className="text-center mb-8">
                <h4 className="text-xl font-serif font-bold text-slate-800 mb-2">「{island.name}」の到達証明</h4>
                <p className="text-sm text-slate-500">
                  現地で撮影した写真（GPS付）をアップロードすることで、公式認定（Verified）として記録されます。
                </p>
              </div>

              {/* Upload Area & GPS Check-in */}
              {resultStatus === 'idle' && (
                <div className="mb-6 space-y-4">
                  {/* Photo Upload */}
                  <div 
                    onClick={() => !isProcessing && !isLocating && fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                      isProcessing || isLocating ? 'border-slate-200 bg-slate-50 cursor-wait' : 'border-slate-200 cursor-pointer hover:border-blue-500 hover:bg-blue-50 group'
                    }`}
                  >
                    <input 
                      type="file" 
                      accept="image/jpeg,image/png,image/heic" 
                      className="hidden" 
                      ref={fileInputRef}
                      onChange={onFileChange}
                    />
                    {isProcessing ? (
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3"></div>
                        <p className="text-sm font-bold text-blue-600">写真のGPSデータを解析中...</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors mb-3">
                          <Camera className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-bold text-slate-700 mb-1">現地で撮った写真をアップロード</p>
                        <p className="text-xs text-slate-400">JPEG, PNG (位置情報を含むもの)</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-center gap-4">
                    <div className="h-px bg-slate-200 flex-1"></div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">OR</span>
                    <div className="h-px bg-slate-200 flex-1"></div>
                  </div>

                  {/* Current Location GPS */}
                  <button
                    onClick={handleCurrentLocationCheckIn}
                    disabled={isProcessing || isLocating}
                    className="w-full py-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-all flex items-center justify-center gap-2 border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLocating ? (
                      <>
                        <div className="w-5 h-5 border-2 border-slate-400 border-t-slate-700 rounded-full animate-spin"></div>
                        現在地を取得中...
                      </>
                    ) : (
                      <>
                        <Navigation2 className="w-5 h-5 text-blue-500" />
                        この場で「現在地からチェックイン」
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Results */}
              {resultStatus === 'success' && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-gradient-to-br from-emerald-50 to-green-100 border border-emerald-200 rounded-2xl p-6 mb-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h4 className="text-xl font-bold text-emerald-800 mb-2">到達認定 成功！</h4>
                  <p className="text-sm text-emerald-600 mb-3">
                    写真のGPS座標が島の中心から <strong>{distanceInfo?.toFixed(1)}km</strong> 以内であることを確認しました。
                  </p>
                  <p className="text-xs font-bold px-3 py-1 bg-emerald-200/50 text-emerald-700 rounded-full inline-block">
                    OFFICIAL RECORD OF ARRIVAL 獲得
                  </p>
                </motion.div>
              )}

              {(resultStatus === 'error' || resultStatus === 'no_gps') && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-rose-50 border border-rose-200 rounded-2xl p-6 mb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <AlertCircle className="w-6 h-6 text-rose-500 shrink-0" />
                    <h4 className="font-bold text-rose-800">認定できませんでした</h4>
                  </div>
                  <p className="text-sm text-rose-600 leading-relaxed mb-4">
                    {errorMessage}
                  </p>
                  <div className="flex justify-center">
                    <button 
                      onClick={() => { setResultStatus('idle'); setErrorMessage(''); }}
                      className="px-4 py-2 bg-white border border-rose-200 rounded-xl text-rose-600 text-sm font-bold hover:bg-rose-50 transition-colors"
                    >
                      別の写真を試す
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Info & Self Report */}
              <div className="bg-slate-50 rounded-xl p-4 flex gap-3 mb-6">
                <Info className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-600 leading-relaxed">
                  過去の旅行でGPS付きの写真がない場合や、GPS判定をスキップしたい場合は、自己申告による通常の記録が可能です。
                </div>
              </div>

              <div className="flex items-center justify-center">
                {resultStatus === 'success' ? (
                  <button 
                    onClick={handleClose}
                    className="w-full py-3.5 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-all shadow-md"
                  >
                    閉じる
                  </button>
                ) : (
                  <button 
                    onClick={handleSelfReport}
                    className="w-full py-3.5 rounded-xl bg-white border-2 border-slate-200 text-slate-600 font-bold text-sm hover:border-slate-300 hover:bg-slate-50 transition-all"
                  >
                    自己申告で「行った」記録をつける
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
