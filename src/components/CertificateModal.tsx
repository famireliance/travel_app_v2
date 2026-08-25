'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Share2, Award, Camera, CheckCircle, Sparkles, Send, Calendar, User } from 'lucide-react';
import imageCompression from 'browser-image-compression';

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  island: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user?: any;
  anniversaryMode?: boolean;
}

import { useTravel } from '@/context/TravelContext';
import { getFormattedSerial, getIslandDifficulty } from '@/lib/difficulty';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';

export default function CertificateModal({ isOpen, onClose, island, user, anniversaryMode = false }: CertificateModalProps) {
  const { travelerName: contextTravelerName, updateTravelerName, companionChar, companionStage, islandStatuses, tempCheckInPhotoUrl, tempCheckInDate, subscriptionTier } = useTravel();
  const isPremium = subscriptionTier === 'premium' || subscriptionTier === 'ultimate';
  const status = island ? (islandStatuses[island.id] || 'none') : 'none';
  const isVerified = status === 'verified_visited';
  const [travelerName, setTravelerName] = useState<string>('');
  const [visitDate, setVisitDate] = useState<string>('');
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [includeCompanionStamp, setIncludeCompanionStamp] = useState(true);
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderPlan, setOrderPlan] = useState<'standard' | 'frame_simple' | 'frame_wood' | 'frame_acrylic'>('standard');
  const [orderDesign, setOrderDesign] = useState<'horizontal' | 'vertical'>('horizontal');
  const [isLaminated, setIsLaminated] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  
  // Mailing Form Fields
  const [recipientCountry, setRecipientCountry] = useState('Japan');
  const [recipientName, setRecipientName] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [address, setAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  
  const [assignedSerial, setAssignedSerial] = useState('');
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [issuedTypes, setIssuedTypes] = useState<string[]>([]);
  const [certificateType, setCertificateType] = useState<'card' | 'high_quality'>('high_quality');
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  const [designTheme, setDesignTheme] = useState<'classic' | 'modern' | 'vintage'>('classic');
  const [isFullscreenPreview, setIsFullscreenPreview] = useState(false);
  const [isPlayingAd, setIsPlayingAd] = useState(false);
  const [adTimeLeft, setAdTimeLeft] = useState(0);
  const [hasHologram, setHasHologram] = useState(false);
  const [limitReachedError, setLimitReachedError] = useState(false);
  const [limitErrorMessage, setLimitErrorMessage] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fullscreenCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isOpen && island && user) {
      // Check if user has uploaded a photo for this island
      if (tempCheckInPhotoUrl) {
        setHasHologram(true);
      } else {
        supabase.from('island_diaries')
          .select('photo_url')
          .eq('island_id', island.id)
          .eq('user_id', user.id)
          .not('photo_url', 'is', null)
          .limit(1)
          .then(({ data }) => {
            if (data && data.length > 0) {
              setHasHologram(true);
            } else {
              setHasHologram(false);
            }
          });
      }
    } else {
      setHasHologram(false);
    }
  }, [isOpen, island, user, tempCheckInPhotoUrl]);

  // Use useEffect to check localStorage for daily issue count
  useEffect(() => {
    if (isOpen && island) {
      setLimitReachedError(false);
      // Check local storage for today's issue
      const todayStr = new Date().toISOString().split('T')[0];
      const types = [];
      if (localStorage.getItem(`kiratabi_issued_${island.id}_card`) === todayStr) types.push('card');
      if (localStorage.getItem(`kiratabi_issued_${island.id}_high_quality`) === todayStr) types.push('high_quality');
      setIssuedTypes(types);
    }
  }, [isOpen, island]);

  const handleDigitalIssueClick = (type: 'card' | 'high_quality' = 'high_quality') => {
    setCertificateType(type);
    if (!isPremium) {
      setIsPlayingAd(true);
      setAdTimeLeft(5);
    } else {
      issueDigital(type);
    }
  };

  const issueDigital = useCallback(async (type: string = certificateType) => {
    if (!island) return;
    
    let uploadedImageUrl: string | undefined = undefined;

    if (isPremium && user && canvasRef.current) {
      try {
        const blob = await new Promise<Blob | null>(resolve => {
          canvasRef.current?.toBlob(resolve, 'image/png', 0.9);
        });
        if (blob) {
          const fileName = `${user.id}/${island.id}_${Date.now()}.png`;
          const { data, error } = await supabase.storage.from('certificates').upload(fileName, blob, { contentType: 'image/png' });
          if (!error) {
            const { data: { publicUrl } } = supabase.storage.from('certificates').getPublicUrl(fileName);
            uploadedImageUrl = publicUrl;
          } else {
            console.error('Failed to upload certificate to storage:', error);
          }
        }
      } catch (err) {
        console.error('Blob generation error:', err);
      }
    }

    if (user) {
      try {
        const res = await fetch('/api/certificates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ islandId: island.id, userId: user.id, type, imageUrl: uploadedImageUrl })
        });
        const data = await res.json();
        
        if (!res.ok) {
          if (data.error === 'FREE_LIMIT_REACHED') {
            setLimitReachedError(true);
            return;
          }
          throw new Error(data.error || 'Failed to issue');
        }
        
        if (data.certificate) {
          setAssignedSerial(`No.${String(data.certificate.serial_number).padStart(4, '0')}`);
        }
      } catch (err) {
        console.error('Failed to issue certificate on server:', err);
      }
    }

    const issuedKey = `kiratabi_issued_${island.id}_${type}`;
    const todayStr = new Date().toISOString().split('T')[0];
    localStorage.setItem(issuedKey, todayStr);

    setIssuedTypes(prev => {
      if (!prev.includes(type)) return [...prev, type];
      return prev;
    });
  }, [island, user, isPremium, certificateType]);

  useEffect(() => {
    if (isPlayingAd && adTimeLeft > 0) {
      const timer = setTimeout(() => {
        setAdTimeLeft(adTimeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (isPlayingAd && adTimeLeft === 0) {
      // Ad finished
      const timer = setTimeout(() => {
        setIsPlayingAd(false);
        issueDigital(certificateType);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isPlayingAd, adTimeLeft, issueDigital, certificateType]); 

  useEffect(() => {
    if (isOpen && island) {
      const today = new Date();
      const dateStr = tempCheckInDate || `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;
      setVisitDate(dateStr);
      setCustomImage(tempCheckInPhotoUrl || null);
      setTravelerName(contextTravelerName || user?.email?.split('@')[0] || '島旅トラベラー');
      setIsOrdering(false);
      setOrderSuccess(false);
      setErrorMessage(null);
      setUploadError(null);
      setAssignedSerial(getFormattedSerial(island.id || island.name));
      // In a real app, check if user already paid for this island's certificate
      setIssuedTypes([]);
    }
  }, [isOpen, island, user, contextTravelerName, tempCheckInDate, tempCheckInPhotoUrl]);

  const handleOrderSubmit = async () => {
    if (!recipientName.trim() || !address.trim() || !postalCode.trim() || !phoneNumber.trim()) {
      setErrorMessage('すべての必須項目（お名前、郵便番号、ご住所、電話番号）を入力してください。');
      return;
    }
    setErrorMessage(null);
    setOrderSubmitting(true);
    try {
      const res = await fetch('/api/order/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: orderPlan,
          design: orderDesign,
          laminated: isLaminated,
          country: recipientCountry,
          travelerName,
          recipientName,
          postalCode,
          address,
          phone: phoneNumber,
          islandId: island?.id,
          islandName: island?.name,
          visitDate,
          userId: user?.id
        })
      });
      const data = await res.json();
      if (res.ok && data.url) {
        // Stripe Checkoutページへリダイレクト
        window.location.href = data.url;
      } else {
        setErrorMessage(data.error || '決済ページの準備中にエラーが発生しました。');
      }
    } catch (e) {
      console.error(e);
      setErrorMessage('通信エラーが発生しました。');
    } finally {
      setOrderSubmitting(false);
    }
  };

  const handlePostalCodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^\d]/g, '');
    setPostalCode(val);
    if (recipientCountry === 'Japan' && val.length === 7) {
      try {
        const res = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${val}`);
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          const addr = data.results[0];
          setAddress(`${addr.address1}${addr.address2}${addr.address3}`);
        }
      } catch (err) {
        console.error('Failed to fetch address:', err);
      }
    }
  };


  // Handle Photo Upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadError(null);
      try {
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        };
        // 巨大な写真も自動で1MB以下に圧縮
        const compressedFile = await imageCompression(file, options);
        const reader = new FileReader();
        reader.onload = (event) => {
          setCustomImage(event.target?.result as string);
        };
        reader.readAsDataURL(compressedFile);
      } catch (error) {
        console.error('画像圧縮エラー:', error);
        setUploadError('画像の最適化に失敗しました。別の写真をお試しください。');
      }
    }
  };

  // Draw Certificate to Canvas
  const drawCertificate = useCallback(() => {
    const drawToCanvas = (canvas: HTMLCanvasElement | null) => {
      if (!canvas || !island) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const baseW = certificateType === 'card' ? 600 : 1200;
      const baseH = certificateType === 'card' ? 840 : 900;
      const width = orientation === 'horizontal' ? Math.max(baseW, baseH) : Math.min(baseW, baseH);
      const height = orientation === 'horizontal' ? Math.min(baseW, baseH) : Math.max(baseW, baseH);

      canvas.width = width;
      canvas.height = height;

      const renderContent = (ctx: CanvasRenderingContext2D, heroImg?: HTMLImageElement) => {
        if (anniversaryMode) {
          // Anniversary mode logic (simplified for brevity or kept original)
          ctx.fillStyle = '#0A0F2E';
          ctx.fillRect(0, 0, width, height);
          ctx.strokeStyle = '#C9A84C';
          ctx.lineWidth = 14;
          ctx.strokeRect(25, 25, width - 50, height - 50);
          ctx.fillStyle = '#E8D5A3';
          ctx.font = 'bold 40px serif';
          ctx.textAlign = 'center';
          ctx.fillText('★★★ 1ST ANNIVERSARY ★★★', width / 2, height / 2);
          return;
        }

        // Background based on designTheme
        if (designTheme === 'modern') {
          const grad = ctx.createLinearGradient(0, 0, width, height);
          grad.addColorStop(0, '#0F172A');
          grad.addColorStop(1, '#1E3A8A');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, width, height);
          ctx.strokeStyle = '#94A3B8';
          ctx.lineWidth = 8;
          ctx.strokeRect(30, 30, width - 60, height - 60);
          ctx.strokeStyle = '#38BDF8';
          ctx.lineWidth = 2;
          ctx.strokeRect(42, 42, width - 84, height - 84);
        } else if (designTheme === 'vintage') {
          ctx.fillStyle = '#FCE3B6';
          ctx.fillRect(0, 0, width, height);
          ctx.strokeStyle = '#8B4513';
          ctx.lineWidth = 10;
          ctx.strokeRect(30, 30, width - 60, height - 60);
          ctx.strokeStyle = '#A0522D';
          ctx.lineWidth = 2;
          ctx.strokeRect(46, 46, width - 92, height - 92);
        } else {
          // Classic Gold
          const grad = ctx.createRadialGradient(width / 2, height / 2, 100, width / 2, height / 2, Math.max(width, height));
          grad.addColorStop(0, '#1E293B');
          grad.addColorStop(1, '#0F172A');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, width, height);
          ctx.strokeStyle = '#D4AF37';
          ctx.lineWidth = 12;
          ctx.strokeRect(30, 30, width - 60, height - 60);
          ctx.strokeStyle = '#F3E5AB';
          ctx.lineWidth = 2;
          ctx.strokeRect(46, 46, width - 92, height - 92);
        }

        // Holographic Overlay (if applicable)
        if (hasHologram && certificateType === 'high_quality') {
          const holoGrad = ctx.createLinearGradient(0, 0, width, height);
          holoGrad.addColorStop(0, 'rgba(236, 72, 153, 0.15)');
          holoGrad.addColorStop(0.5, 'rgba(14, 165, 233, 0.15)');
          holoGrad.addColorStop(1, 'rgba(16, 185, 129, 0.15)');
          ctx.fillStyle = holoGrad;
          ctx.fillRect(0, 0, width, height);
        }

        // Text Colors
        let primaryColor, secondaryColor, accentColor;
        if (designTheme === 'modern') {
          primaryColor = '#F8FAFC'; secondaryColor = '#94A3B8'; accentColor = '#38BDF8';
        } else if (designTheme === 'vintage') {
          primaryColor = '#3E2723'; secondaryColor = '#5D4037'; accentColor = '#D84315';
        } else {
          primaryColor = '#F3E5AB'; secondaryColor = '#94A3B8'; accentColor = '#D4AF37';
        }

        const isVert = orientation === 'vertical';
        const cx = width / 2;

        ctx.textAlign = 'center';
        
        // Headers
        ctx.fillStyle = secondaryColor;
        ctx.font = `bold ${isVert ? 16 : 20}px serif`;
        ctx.fillText(hasHologram ? 'VERIFIED PHOTO DIARY RECORD' : 'VERIFIED RECORD OF ARRIVAL', cx, isVert ? 90 : 110);
        
        ctx.fillStyle = accentColor;
        ctx.font = `bold ${isVert ? 36 : 48}px serif`;
        ctx.fillText(certificateType === 'card' ? '到 達 証' : '島 旅 到 達 公 認 証', cx, isVert ? 140 : 175);

        // Name
        const nameY = isVert ? 250 : 380;
        ctx.fillStyle = 'rgba(128, 128, 128, 0.1)';
        ctx.fillRect(cx - (isVert?200:300), nameY - 50, (isVert?400:600), 70);
        ctx.fillStyle = primaryColor;
        ctx.font = `bold ${isVert ? 32 : 44}px serif`;
        ctx.fillText(travelerName || 'Voyager', cx, nameY);

        // Island Info
        const infoY = isVert ? 330 : 470;
        const diff = getIslandDifficulty(island);
        ctx.fillStyle = accentColor;
        ctx.font = `bold ${isVert ? 20 : 26}px sans-serif`;
        ctx.fillText(`【 到達島 】 ${island.name} (${island.region_id || 'Japan'})`, cx, infoY);
        
        ctx.fillStyle = designTheme === 'modern' ? '#38BDF8' : '#F59E0B';
        ctx.font = `bold ${isVert ? 16 : 20}px sans-serif`;
        ctx.fillText(`【 冒険難易度 】 ${diff.stars} (${diff.shortLabel})`, cx, infoY + 35);

        ctx.fillStyle = secondaryColor;
        ctx.font = `${isVert ? 16 : 22}px monospace`;
        ctx.fillText(`DATE OF ARRIVAL: ${visitDate}`, cx, infoY + 75);

        // Hero Image
        if (heroImg) {
          ctx.save();
          const heroW = isVert ? 320 : 440;
          const heroH = isVert ? 180 : 190;
          const heroX = cx - heroW / 2;
          const heroY = isVert ? 450 : 585;
          ctx.beginPath();
          ctx.rect(heroX, heroY, heroW, heroH);
          ctx.clip();
          const scale = Math.max(heroW / heroImg.width, heroH / heroImg.height);
          const dw = heroImg.width * scale;
          const dh = heroImg.height * scale;
          ctx.drawImage(heroImg, heroX + (heroW - dw) / 2, heroY + (heroH - dh) / 2, dw, dh);
          ctx.restore();
          ctx.strokeStyle = accentColor;
          ctx.lineWidth = 3;
          ctx.strokeRect(heroX, heroY, heroW, heroH);
        }

        // Seal
        const sealX = width - (isVert ? 100 : 180);
        const sealY = height - (isVert ? 100 : 180);
        const sealRadius = isVert ? 40 : 65;
        
        ctx.beginPath();
        ctx.arc(sealX, sealY, sealRadius, 0, Math.PI * 2);
        ctx.strokeStyle = '#E11D48';
        ctx.lineWidth = isVert ? 3 : 5;
        ctx.stroke();

        ctx.fillStyle = '#E11D48';
        ctx.font = `bold ${isVert ? 12 : 18}px serif`;
        ctx.fillText('KIRATABI', sealX, sealY - (isVert ? 8 : 15));
        ctx.font = `bold ${isVert ? 14 : 22}px serif`;
        ctx.fillText('公認証明', sealX, sealY + (isVert ? 12 : 15));

        // Serial Number
        const displaySerial = assignedSerial || `No.0001`;
        ctx.textAlign = 'left';
        ctx.fillStyle = secondaryColor;
        ctx.font = `${isVert ? 12 : 16}px monospace`;
        ctx.fillText(`SERIAL: ${displaySerial}`, isVert ? 50 : 80, height - (isVert ? 50 : 70));
      };

      if (customImage) {
        const img = new Image();
        img.onload = () => renderContent(ctx, img);
        img.src = customImage;
      } else {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => renderContent(ctx, img);
        img.src = `https://picsum.photos/seed/${island.id}/800/600`;
      }
    };

    drawToCanvas(canvasRef.current);
    if (isFullscreenPreview) {
      drawToCanvas(fullscreenCanvasRef.current);
    }
  }, [island, anniversaryMode, travelerName, visitDate, hasHologram, includeCompanionStamp, companionChar, companionStage, customImage, certificateType, orientation, designTheme, isFullscreenPreview, assignedSerial]);

  useEffect(() => {
    if (isFullscreenPreview) {
      // Small delay to allow the conditionally rendered canvas to mount
      const timer = setTimeout(() => {
        drawCertificate();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isFullscreenPreview, drawCertificate]);


  useEffect(() => {
    if (!isOpen || !island) return;
    const timer = setTimeout(() => {
      drawCertificate();
    }, 300);
    return () => clearTimeout(timer);
  }, [isOpen, island, drawCertificate]);

  // Handle Download (CORS Safe)
  const handleDownload = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Instead of directly using toDataURL which can cause security errors if CORS images were drawn,
    // we use a blob. If there's still a CORS issue, the canvas might be tainted.
    // However, imageCompression creates a local data URL or blob, which doesn't taint.
    // If island.image_url is used, it must have CORS headers from Supabase.
    try {
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `KIRATABI_Certificate_${island?.name || 'Island'}.png`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      }, 'image/png');
    } catch (e) {
      console.error('Download error (CORS):', e);
      setErrorMessage('画像の保存に失敗しました。画像に外部のリソースが含まれている可能性があります。');
    }
  };

  // Handle Web Share API (Native Share Menu)
  const handleNativeShare = async () => {
    const text = `日本の離島「${island?.name}」に到達しました🏝️✨\n#KIRATABI #島専科 #${island?.name} #離島旅`;
    const url = `https://island.kira-tabi.com/island/${island?.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'KIRATABI 到達証明',
          text: text,
          url: url
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    } else {
      // Fallback to X share if Web Share API is not supported
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
      window.open(twitterUrl, '_blank');
    }
  };

  // Handle Instagram specific instruction
  const handleInstagramShare = () => {
    toast('Instagramでシェアするには、まず画像をダウンロード（保存）し、Instagramアプリを開いて投稿してください。', { icon: '📸', duration: 4000 });
    handleDownload();
  };

  if (!isOpen || !island) return null;

  if (!isVerified) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 lg:p-8"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden bg-white"
          >
            <div className="bg-slate-100 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-700">到達記録</h3>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 text-center">
              <div className="w-24 h-24 mx-auto bg-blue-50 rounded-full flex items-center justify-center mb-4">
                {companionChar ? (
                  <span className="text-4xl">{companionStage?.icon || '🦉'}</span>
                ) : (
                  <CheckCircle className="w-12 h-12 text-blue-400" />
                )}
              </div>
              <h4 className="font-serif font-bold text-xl text-slate-800 mb-2">「{island.name}」<br/>自己申告記録完了！</h4>
              
              <div className="text-xs font-mono text-slate-400 bg-slate-100 py-1.5 px-4 rounded-full inline-block mb-4 border border-slate-200">
                DATE OF ARRIVAL: {visitDate}
              </div>

              <p className="text-sm text-slate-500 mb-6">
                簡易到達記録を保存しました。到達率がアップします！
              </p>
              
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold text-amber-800">公式認定でさらに豪華に！</span>
                </div>
                <p className="text-xs text-amber-700 leading-relaxed">
                  現地での写真(GPS付)やGPSチェックインを行うと、<strong className="text-amber-900">ポイント獲得</strong>や<strong className="text-amber-900">高画質な公式証明書</strong>の発行が可能になります！
                </p>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100">
              <button onClick={onClose} className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition-colors">
                閉じる
              </button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-4 lg:p-8 overflow-y-auto"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className={`w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
            isVerified ? 'bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200' : 'bg-slate-800 border border-slate-700'
          }`}
        >
          {/* Inject AuthModal just in case they need to login */}
          {/* Note: We need to import AuthModal at the top, but we can do it inline or assume it's available via context, 
              actually it's better to just prompt them to close and login via the top right, but let's render a simple message */}
          {/* Modal Header */}
          <div className={`flex items-center justify-between px-6 py-4 border-b sticky top-0 z-10 ${
            isVerified ? 'bg-amber-100/80 border-amber-200' : 'border-slate-700 bg-slate-800/80'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isVerified ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              }`}>
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`font-serif font-bold text-lg ${isVerified ? 'text-amber-900' : 'text-white'}`}>
                  {isVerified ? 'KIRATABI公認 到達証明書' : 'KIRATABI公認 到達証明書の発行'}
                </h3>
                <p className={`text-xs tracking-wider ${isVerified ? 'text-amber-700/70' : 'text-slate-400'}`}>
                  KIRATABI VERIFIED ARRIVAL CERTIFICATE
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-full transition-colors ${isVerified ? 'text-amber-900/60 hover:text-amber-900' : 'text-slate-400 hover:text-white'}`}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto space-y-8 flex-1">
            
            {!isOrdering ? (
              <>
                {/* Customizer Inputs */}
                <div className="space-y-4 bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50 mb-4">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-amber-400" /> 旅人ネーム
                      </label>
                      <input type="text" value={travelerName} onChange={(e) => { setTravelerName(e.target.value); updateTravelerName(e.target.value); }} placeholder="お名前" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-amber-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-amber-400" /> 到達日
                      </label>
                      <input type="text" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} placeholder="YYYY.MM.DD" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-amber-500" />
                    </div>
                  </div>

                  {/* Certificate Configuration */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-700/60">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1">種類 (Type)</label>
                      <div className="flex bg-slate-800 rounded-lg p-1">
                        <button onClick={() => setCertificateType('card')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${certificateType === 'card' ? 'bg-amber-500 text-slate-900' : 'text-slate-400 hover:text-white'}`}>カード版</button>
                        <button onClick={() => setCertificateType('high_quality')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${certificateType === 'high_quality' ? 'bg-amber-500 text-slate-900' : 'text-slate-400 hover:text-white'}`}>高画質版</button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1">向き (Orientation)</label>
                      <div className="flex bg-slate-800 rounded-lg p-1">
                        <button onClick={() => setOrientation('horizontal')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${orientation === 'horizontal' ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-white'}`}>横型</button>
                        <button onClick={() => setOrientation('vertical')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${orientation === 'vertical' ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-white'}`}>縦型</button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1">デザイン (Theme)</label>
                      <select value={designTheme} onChange={(e: any) => setDesignTheme(e.target.value)} className="w-full bg-slate-800 border-none rounded-lg px-2 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500">
                        <option value="classic">クラシックゴールド</option>
                        <option value="modern">モダンサファイア</option>
                        <option value="vintage">ヴィンテージパーチメント</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Guardian Spirit & Photo */}
                  <div className="pt-2 border-t border-slate-700/60">
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                      <div className="flex items-center gap-3 w-full md:w-auto">
                        <Camera className="w-4 h-4 text-slate-400" />
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="text-xs text-slate-300 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-slate-700 file:text-amber-400" />
                        {customImage && <button onClick={() => setCustomImage(null)} className="text-xs text-rose-400 hover:underline">削除</button>}
                      </div>
                      {companionChar && companionStage && (
                        <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                          <input type="checkbox" checked={includeCompanionStamp} onChange={(e) => setIncludeCompanionStamp(e.target.checked)} className="rounded text-amber-500 bg-slate-800 border-slate-600" />
                          <span className="text-amber-400">{companionStage.icon} 精霊刻印</span>
                        </label>
                      )}
                    </div>
                  </div>
                </div>

                {/* Canvas Preview Box */}
                <div className="flex flex-col items-center relative mb-6">
                  <div className="w-full flex items-center justify-between mb-2">
                    <p className="text-xs text-slate-400 tracking-widest uppercase flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" /> プレビュー
                    </p>
                    <button onClick={() => setIsFullscreenPreview(true)} className="text-xs font-bold text-blue-400 hover:text-blue-300">拡大表示</button>
                  </div>
                  
                  <div className="w-full bg-slate-950 p-4 rounded-2xl border border-slate-700/60 shadow-inner flex justify-center cursor-zoom-in overflow-hidden" onClick={() => setIsFullscreenPreview(true)}>
                    <canvas ref={canvasRef} className="max-w-full h-auto rounded-lg shadow-2xl border border-slate-800 transition-all duration-300" style={{ maxHeight: '400px' }} />
                  </div>
                </div>

                {/* Issuance Action Buttons */}
                <div className="bg-slate-900 border border-slate-700 p-4 rounded-2xl mb-4">
                  <h4 className="text-white font-bold text-sm mb-3 flex items-center gap-2"><Award className="w-4 h-4 text-amber-400"/> デジタル証明書の発行</h4>
                  {!user ? (
                    <div className="text-center p-4 bg-slate-800 rounded-xl">
                      <p className="text-xs text-slate-400 mb-3">公式証明書を発行・保存するにはログインが必要です。</p>
                      <button onClick={onClose} className="py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg">ログイン画面へ</button>
                    </div>
                  ) : limitReachedError ? (
                    <div className="text-center p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl">
                      <p className="text-xs text-rose-400 mb-2">{limitErrorMessage}</p>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button 
                        onClick={() => handleDigitalIssueClick('card')} 
                        disabled={issuedTypes.includes('card')}
                        className={`flex-1 py-3 rounded-xl font-bold text-xs transition-colors border ${issuedTypes.includes('card') ? 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed' : 'bg-slate-800 border-slate-600 text-white hover:bg-slate-700'}`}
                      >
                        {issuedTypes.includes('card') ? 'カード版 発行済み' : '【無料】カード版を発行'}
                      </button>
                      <button 
                        onClick={() => handleDigitalIssueClick('high_quality')} 
                        disabled={issuedTypes.includes('high_quality')}
                        className={`flex-1 py-3 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 ${issuedTypes.includes('high_quality') ? 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed' : 'bg-blue-600 border-blue-500 text-white hover:bg-blue-500'}`}
                      >
                        <Sparkles className="w-3.5 h-3.5" /> 
                        {issuedTypes.includes('high_quality') ? '高画質版 発行済み' : '公式高画質版を発行 (Free:月1枚)'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Viral & Free Download Actions */}
                <div className={`grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 transition-all duration-500 ${issuedTypes.length === 0 ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                  <button
                    onClick={handleNativeShare}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs tracking-wide flex items-center justify-center gap-2 shadow-lg transition-all"
                  >
                    <Share2 className="w-4 h-4" />
                    シェア(X/LINE等)
                  </button>
                  <button
                    onClick={handleInstagramShare}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 hover:from-pink-400 hover:to-yellow-400 text-white font-bold text-xs tracking-wide flex items-center justify-center gap-2 shadow-lg transition-all"
                  >
                    <Camera className="w-4 h-4" />
                    Instagramへ
                  </button>
                  <button
                    onClick={handleDownload}
                    className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs tracking-wide flex items-center justify-center gap-2 shadow-lg transition-all"
                  >
                    <Download className="w-4 h-4" />
                    画像DL(無料)
                  </button>
                </div>

                {/* Monetization Banner (Physical Mail Order) */}
                <div className="mt-6 bg-gradient-to-br from-amber-500/10 via-slate-800 to-amber-500/5 p-6 rounded-3xl border border-amber-500/30 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="space-y-1 text-center md:text-left">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold tracking-wider mb-1">
                      <Sparkles className="w-3.5 h-3.5" /> オフィシャル郵送オーダー
                    </div>
                    <h4 className="font-serif font-bold text-white text-lg">世界にひとつだけの紙証明書をお手元へ</h4>
                    <p className="text-xs text-slate-300 leading-relaxed max-w-md">
                      高品質な厚紙・金箔押し調の印刷仕上げで、ご自宅やオフィスに飾れるオフィシャル紙証明書を郵送いたします。
                    </p>
                  </div>
                  <button
                    onClick={() => setIsOrdering(true)}
                    className="shrink-0 px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-bold text-sm tracking-wider shadow-xl transition-all hover:scale-105"
                  >
                    郵送オーダーを申し込む →
                  </button>
                </div>
              </>
            ) : (
              /* Physical Mail Order Flow */
              <div className="space-y-6 max-w-xl mx-auto py-4">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setIsOrdering(false)}
                    className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                  >
                    ← プレビューに戻る
                  </button>
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Physical Certificate Order</span>
                </div>

                {!orderSuccess ? (
                  <div className="space-y-6 bg-slate-900/60 p-6 rounded-3xl border border-slate-700">
                    <h4 className="font-serif font-bold text-white text-xl text-center">プラン選択と配送先入力</h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div
                        onClick={() => setOrderPlan('standard')}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                          orderPlan === 'standard' ? 'border-amber-500 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'border-slate-700 bg-slate-800'
                        }`}
                      >
                        <span className="text-xs font-bold text-amber-400 block mb-1">台紙付き (基本)</span>
                        <div className="text-lg font-bold text-white mb-2">¥1,500</div>
                        <p className="text-[10px] text-slate-300">A4高品質印刷・特製台紙付き。</p>
                      </div>
                      <div
                        onClick={() => setOrderPlan('frame_simple')}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                          orderPlan === 'frame_simple' ? 'border-amber-500 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'border-slate-700 bg-slate-800'
                        }`}
                      >
                        <span className="text-xs font-bold text-amber-400 block mb-1">簡易フレーム [OP]</span>
                        <div className="text-lg font-bold text-white mb-2">¥3,000</div>
                        <p className="text-[10px] text-slate-300">壁掛け・卓上両対応の軽量フレーム。</p>
                      </div>
                      <div
                        onClick={() => setOrderPlan('frame_wood')}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                          orderPlan === 'frame_wood' ? 'border-amber-500 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'border-slate-700 bg-slate-800'
                        }`}
                      >
                        <span className="text-xs font-bold text-amber-400 block mb-1">高級木製フレーム [OP]</span>
                        <div className="text-lg font-bold text-white mb-2">¥6,000</div>
                        <p className="text-[10px] text-slate-300">重厚感のある木製フレーム装飾。</p>
                      </div>
                      <div
                        onClick={() => setOrderPlan('frame_acrylic')}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                          orderPlan === 'frame_acrylic' ? 'border-amber-500 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'border-slate-700 bg-slate-800'
                        }`}
                      >
                        <span className="text-xs font-bold text-amber-400 block mb-1">アクリル額装プレミアム [OP]</span>
                        <div className="text-lg font-bold text-white mb-2">¥10,000</div>
                        <p className="text-[10px] text-slate-300">浮き出し加工の最高級アクリル額。</p>
                      </div>
                    </div>

                    {/* Options (Lamination & Design) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700">
                        <label className="block text-xs font-bold text-slate-400 mb-3">デザイン方向</label>
                        <div className="flex gap-2">
                          <button onClick={() => setOrderDesign('horizontal')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${orderDesign === 'horizontal' ? 'bg-amber-500 text-slate-900' : 'bg-slate-900 text-slate-400'}`}>横版</button>
                          <button onClick={() => setOrderDesign('vertical')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${orderDesign === 'vertical' ? 'bg-amber-500 text-slate-900' : 'bg-slate-900 text-slate-400'}`}>縦版</button>
                        </div>
                      </div>
                      <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700">
                        <label className="block text-xs font-bold text-slate-400 mb-3">ラミネート加工 (+¥300)</label>
                        <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-white">
                          <input type="checkbox" checked={isLaminated} onChange={e => setIsLaminated(e.target.checked)} className="w-5 h-5 rounded text-amber-500 bg-slate-900 border-slate-600 focus:ring-amber-400" />
                          追加する (耐久性・光沢UP)
                        </label>
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-700/50">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1">配送国 (Country)</label>
                        <select 
                          value={recipientCountry}
                          onChange={e => setRecipientCountry(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                        >
                          <option value="Japan">日本 (Japan)</option>
                          <option value="USA">United States</option>
                          <option value="Taiwan">Taiwan</option>
                          <option value="South Korea">South Korea</option>
                          <option value="Other">Other (International)</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-400 mb-1">郵便番号 / Zip Code</label>
                          <input 
                            type="text" 
                            value={postalCode}
                            onChange={handlePostalCodeChange}
                            placeholder={recipientCountry === 'Japan' ? "例: 1000001 (ハイフンなし)" : "Zip Code"} 
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500" 
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-400 mb-1">電話番号 / Phone Number</label>
                          <input 
                            type="text" 
                            value={phoneNumber}
                            onChange={e => setPhoneNumber(e.target.value)}
                            placeholder="例: 090-1234-5678" 
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500" 
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1">住所 / Address (自動入力可)</label>
                        <input 
                          type="text" 
                          value={address}
                          onChange={e => setAddress(e.target.value)}
                          placeholder="都道府県・市区町村・番地・マンション名" 
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500" 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1">お名前 / Full Name</label>
                        <input 
                          type="text" 
                          value={recipientName}
                          onChange={e => setRecipientName(e.target.value)}
                          placeholder="山田 太郎" 
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500" 
                        />
                      </div>
                    </div>

                    {errorMessage && (
                      <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
                        {errorMessage}
                      </div>
                    )}

                    <button
                      onClick={handleOrderSubmit}
                      disabled={orderSubmitting}
                      className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-bold text-sm tracking-widest shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                      {orderSubmitting ? '処理中...' : '決済へ進む'}
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-12 space-y-4 bg-slate-900/60 p-8 rounded-3xl border border-emerald-500/30">
                    <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto animate-bounce" />
                    <h4 className="font-serif font-bold text-white text-2xl">ご注文受付完了！</h4>
                    <p className="text-slate-300 text-sm leading-relaxed max-w-md mx-auto">
                      「{island.name}」の到達証明書のオーダーおよび連番シリアル発行が確定いたしました。ご指定住所宛に約3〜5営業日で発送いたします。
                    </p>
                    <div className="bg-slate-800/80 border border-amber-500/40 rounded-2xl p-4 max-w-sm mx-auto text-left space-y-2 my-4">
                      <div className="text-xs text-slate-400 flex justify-between">
                        <span>受付状況:</span>
                        <strong className="text-amber-400 font-mono">決済完了・発送準備中</strong>
                      </div>
                      <div className="text-xs text-slate-400 flex justify-between">
                        <span>公認シリアルNo:</span>
                        <strong className="text-emerald-400 font-mono">{assignedSerial}</strong>
                      </div>
                    </div>
                    <button
                      onClick={onClose}
                      className="mt-4 px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm rounded-xl border border-slate-700 transition-colors"
                    >
                      閉じる
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>
        </motion.div>
      </motion.div>

      {/* Fullscreen Preview Overlay */}
      <AnimatePresence>
        {isFullscreenPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] bg-slate-950/95 backdrop-blur-xl flex flex-col"
          >
            <div className="flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800">
              <h3 className="text-white font-bold text-sm">証明書プレビュー (拡大表示)</h3>
              <button onClick={() => setIsFullscreenPreview(false)} className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center cursor-zoom-out" onClick={() => setIsFullscreenPreview(false)}>
              <canvas
                ref={fullscreenCanvasRef}
                className={`max-w-none w-auto max-h-none h-auto shadow-2xl border border-slate-800 ${issuedTypes.length === 0 ? 'blur-sm grayscale opacity-80' : ''}`}
                style={{ width: '1200px', height: '900px', transform: 'scale(0.8)', transformOrigin: 'center' }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mock Video Ad Overlay */}
      <AnimatePresence>
        {isPlayingAd && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[11000] bg-black flex flex-col items-center justify-center"
          >
            <div className="absolute top-8 right-8 text-white font-mono text-xl bg-black/50 px-4 py-2 rounded-xl border border-white/20">
              {adTimeLeft > 0 ? `広告終了まで ${adTimeLeft}秒` : '広告終了！証明書を発行します...'}
            </div>
            
            {/* Dummy Ad Content */}
            <div className="w-full max-w-lg aspect-video bg-slate-900 rounded-xl overflow-hidden border border-slate-700 relative shadow-2xl">
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                <Sparkles className="w-16 h-16 mb-4 opacity-50 animate-pulse" />
                <h2 className="text-2xl font-bold font-serif mb-2">KIRATABI プレミアム</h2>
                <p className="text-sm">〜 旅の思い出を一生の宝物に 〜</p>
                <div className="mt-8 flex gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></div>
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
            
            {adTimeLeft === 0 && (
              <button 
                onClick={() => { setIsPlayingAd(false); issueDigital(certificateType); }}
                className="mt-8 px-6 py-2 bg-white text-black font-bold rounded-full hover:bg-slate-200 transition-colors"
              >
                スキップして証明書を受け取る
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
}
