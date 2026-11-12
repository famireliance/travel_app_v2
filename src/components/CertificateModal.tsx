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
import { getVerifiedIslandPhotos } from '@/lib/islandPhoto';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';

export default function CertificateModal({ isOpen, onClose, island, user, anniversaryMode = false }: CertificateModalProps) {
  const { travelerName: contextTravelerName, updateTravelerName, companionChar, companionStage, islandStatuses, tempCheckInPhotoUrl, setTempCheckInPhotoUrl, tempCheckInDate, subscriptionTier } = useTravel();
  const isPremium = subscriptionTier === 'premium' || subscriptionTier === 'ultimate';
  const status = island
    ? (islandStatuses[String(island.id)] || (island.slug ? islandStatuses[String(island.slug)] : undefined) || 'none')
    : 'none';
  const [travelerName, setTravelerName] = useState<string>('');
  const [visitDate, setVisitDate] = useState<string>('');
  const [customImage, setCustomImage] = useState<string | null>(null);
  const isVerified = status === 'verified_visited' || Boolean(tempCheckInPhotoUrl) || Boolean(customImage);
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
  const renderSeqRef = useRef<number>(0);
  const initializedIslandKeyRef = useRef<string>('');

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

    if (user && canvasRef.current) {
      try {
        const blob = await new Promise<Blob | null>(resolve => {
          try {
            canvasRef.current?.toBlob(resolve, 'image/png', 0.92);
          } catch {
            resolve(null);
          }
        });
        if (blob) {
          const fileName = `certificates/${user.id}/${island.id}_${Date.now()}.png`;
          const { error } = await supabase.storage.from('public-assets').upload(fileName, blob, { contentType: 'image/png', upsert: true });
          if (!error) {
            const { data: { publicUrl } } = supabase.storage.from('public-assets').getPublicUrl(fileName);
            uploadedImageUrl = publicUrl;
          } else {
            // Fallback to certificates bucket if present
            const altName = `${user.id}/${island.id}_${Date.now()}.png`;
            const { error: altErr } = await supabase.storage.from('certificates').upload(altName, blob, { contentType: 'image/png', upsert: true });
            if (!altErr) {
              const { data: { publicUrl } } = supabase.storage.from('certificates').getPublicUrl(altName);
              uploadedImageUrl = publicUrl;
            }
          }
        }
      } catch (err) {
        console.error('Blob generation error:', err);
      }
    }

    if (user) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token || '';
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        const res = await fetch('/api/certificates', {
          method: 'POST',
          headers,
          body: JSON.stringify({ islandId: String(island.id), userId: user.id, type, imageUrl: uploadedImageUrl })
        });
        const data = await res.json();
        
        if (!res.ok) {
          if (data.error === 'FREE_LIMIT_REACHED' || data.error === 'PREMIUM_LIMIT_REACHED') {
            setLimitReachedError(true);
            setLimitErrorMessage(data.message || '今月の公式高画質版クラウド発行枠の上限に達しました（画像DLは引き続きご利用いただけます）。');
          } else {
            console.warn('Server certificate record warning:', data.error);
          }
        } else if (data.certificate) {
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
  }, [island, user, certificateType]);

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
    if (!isOpen || !island) {
      initializedIslandKeyRef.current = '';
      return;
    }

    const initKey = `${island.id}`;
    const isFirstOpenForIsland = initializedIslandKeyRef.current !== initKey;

    if (isFirstOpenForIsland) {
      initializedIslandKeyRef.current = initKey;
      const today = new Date();
      let storedPhoto: string | null = null;
      let storedDate: string | null = null;
      try {
        storedPhoto =
          sessionStorage.getItem(`kiratabi_checkin_photo_${island.id}`) ||
          localStorage.getItem(`kiratabi_checkin_photo_${island.id}`);
        storedDate =
          sessionStorage.getItem(`kiratabi_checkin_date_${island.id}`) ||
          localStorage.getItem(`kiratabi_checkin_date_${island.id}`);
      } catch {
        // Ignore storage errors
      }
      const dateStr =
        tempCheckInDate ||
        storedDate ||
        `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;
      setVisitDate(dateStr);
      setCustomImage(tempCheckInPhotoUrl || storedPhoto || null);
      setTravelerName(contextTravelerName || user?.email?.split('@')[0] || '島旅トラベラー');
      setIsOrdering(false);
      setOrderSuccess(false);
      setErrorMessage(null);
      setUploadError(null);
      setAssignedSerial(getFormattedSerial(island.id || island.name));
    } else if (tempCheckInPhotoUrl) {
      // CheckInModalから新しい写真が渡された場合は確実に反映する
      setCustomImage(tempCheckInPhotoUrl);
      if (tempCheckInDate) setVisitDate(tempCheckInDate);
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


  // Handle Photo Upload (HEIC / 大容量JPEG・PNG 完全対応)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setErrorMessage(null);

    const saveUploadedDataUrl = (dataUrl: string) => {
      setCustomImage(dataUrl);
      setTempCheckInPhotoUrl(dataUrl);
      setHasHologram(true);
      if (island?.id) {
        try {
          sessionStorage.setItem(`kiratabi_checkin_photo_${island.id}`, dataUrl);
          localStorage.setItem(`kiratabi_checkin_photo_${island.id}`, dataUrl);
        } catch {
          // Ignore storage quota errors
        }
      }
    };

    try {
      const options = {
        maxSizeMB: 1.5,
        maxWidthOrHeight: 1920,
        fileType: 'image/jpeg',
        useWebWorker: false,
      };
      const compressedFile = await imageCompression(file, options);
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(compressedFile);
      });
      saveUploadedDataUrl(dataUrl);
    } catch {
      // Fallback: ObjectURL -> offscreen canvas or direct FileReader
      try {
        const objUrl = URL.createObjectURL(file);
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            try {
              const maxDim = 1920;
              let w = img.naturalWidth || img.width;
              let h = img.naturalHeight || img.height;
              if (w > maxDim || h > maxDim) {
                const ratio = Math.min(maxDim / w, maxDim / h);
                w = Math.round(w * ratio);
                h = Math.round(h * ratio);
              }
              const c = document.createElement('canvas');
              c.width = w;
              c.height = h;
              const ctx = c.getContext('2d');
              if (!ctx) throw new Error('No 2d ctx');
              ctx.drawImage(img, 0, 0, w, h);
              URL.revokeObjectURL(objUrl);
              resolve(c.toDataURL('image/jpeg', 0.9));
            } catch (err) {
              URL.revokeObjectURL(objUrl);
              reject(err);
            }
          };
          img.onerror = (err) => {
            URL.revokeObjectURL(objUrl);
            reject(err);
          };
          img.src = objUrl;
        });
        saveUploadedDataUrl(dataUrl);
      } catch (fallbackErr) {
        console.error('画像変換エラー:', fallbackErr);
        try {
          const reader = new FileReader();
          reader.onload = (ev) => {
            if (ev.target?.result) saveUploadedDataUrl(ev.target.result as string);
          };
          reader.readAsDataURL(file);
        } catch {
          setUploadError('画像の読み込みに失敗しました。JPEGまたはPNG形式の写真をお試しください。');
        }
      }
    }
  };

  // Draw Certificate to Canvas
  const drawCertificate = useCallback(() => {
    const drawToCanvas = (canvas: HTMLCanvasElement | null) => {
      if (!canvas || !island) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 📐 アスペクト比計算
      // 横型: ISO A4サイズ比率 (1.414 : 1) → 1414 x 1000 px
      // 縦型: スマートフォン壁紙サイズ比率 (9 : 16) → 1080 x 1920 px (Card: 540 x 960 px)
      let width: number;
      let height: number;

      if (orientation === 'horizontal') {
        width = certificateType === 'card' ? 848 : 1414;
        height = certificateType === 'card' ? 600 : 1000;
      } else {
        width = certificateType === 'card' ? 540 : 1080;
        height = certificateType === 'card' ? 960 : 1920;
      }

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
          // Classic Gold (Rich Baroque Ornamentation)
          const grad = ctx.createRadialGradient(width / 2, height / 2, 100, width / 2, height / 2, Math.max(width, height));
          grad.addColorStop(0, '#1E293B');
          grad.addColorStop(0.7, '#0F172A');
          grad.addColorStop(1, '#090D16');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, width, height);

          // Background Nautical Compass Rose Watermark (背景航海羅針盤透かし)
          ctx.save();
          ctx.translate(width / 2, height / 2);
          ctx.strokeStyle = 'rgba(212, 175, 55, 0.07)';
          ctx.fillStyle = 'rgba(212, 175, 55, 0.04)';
          ctx.lineWidth = 2;
          const r = Math.min(width, height) * 0.35;
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(0, 0, r * 0.85, 0, Math.PI * 2);
          ctx.stroke();
          for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI) / 4;
            const len = i % 2 === 0 ? r * 1.12 : r * 0.82;
            const hw = i % 2 === 0 ? 14 : 7;
            ctx.save();
            ctx.rotate(angle);
            ctx.beginPath();
            ctx.moveTo(0, -len);
            ctx.lineTo(hw, 0);
            ctx.lineTo(0, 0);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();
          }
          ctx.restore();

          // Ambient Gold Stardust Particles (背景金粉ダスト)
          ctx.fillStyle = 'rgba(243, 229, 171, 0.12)';
          for (let i = 0; i < 65; i++) {
            const px = Math.sin(i * 17) * width * 0.45 + width / 2;
            const py = Math.cos(i * 23) * height * 0.45 + height / 2;
            const psize = (i % 3) + 1;
            ctx.beginPath();
            ctx.arc(px, py, psize, 0, Math.PI * 2);
            ctx.fill();
          }

          // Triple Layered Gold Metallic Frames (三重彫刻金枠)
          ctx.strokeStyle = '#D4AF37';
          ctx.lineWidth = 14;
          ctx.strokeRect(24, 24, width - 48, height - 48);

          ctx.strokeStyle = '#F59E0B';
          ctx.lineWidth = 2;
          ctx.strokeRect(36, 36, width - 72, height - 72);

          ctx.strokeStyle = '#F3E5AB';
          ctx.lineWidth = 3;
          ctx.strokeRect(44, 44, width - 88, height - 88);

          ctx.strokeStyle = 'rgba(212, 175, 55, 0.5)';
          ctx.lineWidth = 1;
          ctx.strokeRect(52, 52, width - 104, height - 104);

          // Baroque Gold Corner Filigree Ornaments (四隅の豪華な金箔アラベスクコーナー彫刻)
          const cornerFiligree = (cx: number, cy: number, rot: number) => {
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(rot);
            ctx.strokeStyle = '#D4AF37';
            ctx.fillStyle = '#F3E5AB';
            ctx.lineWidth = 2.5;

            ctx.beginPath();
            ctx.arc(0, 0, 45, 0, Math.PI / 2);
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(0, 0, 52, 0, Math.PI / 2);
            ctx.stroke();

            // Decorative swirls
            ctx.beginPath();
            ctx.arc(28, 28, 12, 0, Math.PI * 2);
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(16, 0, 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.beginPath();
            ctx.arc(0, 16, 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
          };

          cornerFiligree(52, 52, 0); // Top-Left
          cornerFiligree(width - 52, 52, Math.PI / 2); // Top-Right
          cornerFiligree(width - 52, height - 52, Math.PI); // Bottom-Right
          cornerFiligree(52, height - 52, (Math.PI * 3) / 2); // Bottom-Left
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

        // 🎨 縦型 (スマホ壁紙 9:16) vs 横型 (A4印刷 1.414:1) 専属レイアウトエンジン
        if (isVert) {
          // 📱 【縦型テンプレート】 Smartphone Wallpaper 9:16 (1080 x 1920 px)
          ctx.textAlign = 'center';

          // Headers
          ctx.fillStyle = secondaryColor;
          ctx.font = 'bold 28px serif';
          ctx.fillText(hasHologram ? 'VERIFIED PHOTO DIARY RECORD' : 'VERIFIED RECORD OF ARRIVAL', cx, 160);
          
          // Glowing Gold Title
          ctx.fillStyle = accentColor;
          ctx.font = 'bold 64px serif';
          ctx.fillText(certificateType === 'card' ? '到 達 証' : '島 旅 到 達 公 認 証', cx, 250);

          // Subtitle Rule Line
          ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(cx - 240, 280);
          ctx.lineTo(cx + 240, 280);
          ctx.stroke();

          // Name Ribbon Plate (Rich Metallic Banner)
          const nameY = 410;
          const bannerGrad = ctx.createLinearGradient(cx - 360, 0, cx + 360, 0);
          bannerGrad.addColorStop(0, 'rgba(212, 175, 55, 0.05)');
          bannerGrad.addColorStop(0.5, 'rgba(212, 175, 55, 0.25)');
          bannerGrad.addColorStop(1, 'rgba(212, 175, 55, 0.05)');
          ctx.fillStyle = bannerGrad;
          ctx.fillRect(cx - 360, nameY - 48, 720, 80);

          ctx.strokeStyle = '#D4AF37';
          ctx.lineWidth = 2;
          ctx.strokeRect(cx - 360, nameY - 48, 720, 80);
          ctx.strokeStyle = '#F59E0B';
          ctx.lineWidth = 1;
          ctx.strokeRect(cx - 354, nameY - 42, 708, 68);

          ctx.fillStyle = primaryColor;
          ctx.font = 'bold 52px serif';
          ctx.fillText((travelerName || 'Voyager') + ' 殿', cx, nameY + 12);

          // Island Info
          const infoY = 570;
          const diff = getIslandDifficulty(island);
          ctx.fillStyle = accentColor;
          ctx.font = 'bold 36px sans-serif';
          ctx.fillText(`【 到達島 】 ${island.name} (${island.region_id || 'Japan'})`, cx, infoY);
          
          ctx.fillStyle = designTheme === 'modern' ? '#38BDF8' : '#F59E0B';
          ctx.font = 'bold 28px sans-serif';
          ctx.fillText(`【 冒険難易度 】 ${diff.stars} (${diff.shortLabel})`, cx, infoY + 58);

          ctx.fillStyle = secondaryColor;
          ctx.font = '26px monospace';
          ctx.fillText(`DATE OF ARRIVAL: ${visitDate}`, cx, infoY + 115);

          // Hero Image (Smart 縦写真 & 横写真 自動対応 / 写真未設定時は公式海図エンブレム)
          if (heroImg) {
            ctx.save();
            const isPortraitPhoto = heroImg.height > heroImg.width;
            const heroW = isPortraitPhoto ? 760 : 860;
            const heroH = isPortraitPhoto ? 1020 : 560;
            const heroX = cx - heroW / 2;
            const heroY = isPortraitPhoto ? 710 : 860;

            ctx.beginPath();
            ctx.rect(heroX, heroY, heroW, heroH);
            ctx.clip();

            const scale = Math.max(heroW / heroImg.width, heroH / heroImg.height);
            const dw = heroImg.width * scale;
            const dh = heroImg.height * scale;
            ctx.drawImage(heroImg, heroX + (heroW - dw) / 2, heroY + (heroH - dh) / 2, dw, dh);
            ctx.restore();

            // Luxury Double Gold Frame
            ctx.strokeStyle = accentColor;
            ctx.lineWidth = 7;
            ctx.strokeRect(heroX, heroY, heroW, heroH);
            ctx.strokeStyle = '#F59E0B';
            ctx.lineWidth = 2.5;
            ctx.strokeRect(heroX - 7, heroY - 7, heroW + 14, heroH + 14);

            // Ornate Corner Accents around Photo Frame
            const drawCornerBracket = (bx: number, by: number, rot: number) => {
              ctx.save();
              ctx.translate(bx, by);
              ctx.rotate(rot);
              ctx.strokeStyle = '#F3E5AB';
              ctx.lineWidth = 3;
              ctx.beginPath();
              ctx.moveTo(-15, 0);
              ctx.lineTo(0, 0);
              ctx.lineTo(0, -15);
              ctx.stroke();
              ctx.restore();
            };
            drawCornerBracket(heroX - 7, heroY - 7, 0);
            drawCornerBracket(heroX + heroW + 7, heroY - 7, Math.PI / 2);
            drawCornerBracket(heroX + heroW + 7, heroY + heroH + 7, Math.PI);
            drawCornerBracket(heroX - 7, heroY + heroH + 7, (Math.PI * 3) / 2);
          } else {
            // 公式海図・座標紋章プレート（偽写真は一切使用しない）
            const plateW = 820;
            const plateH = 520;
            const plateX = cx - plateW / 2;
            const plateY = 860;
            ctx.fillStyle = 'rgba(15, 23, 42, 0.55)';
            ctx.fillRect(plateX, plateY, plateW, plateH);
            ctx.strokeStyle = accentColor;
            ctx.lineWidth = 4;
            ctx.strokeRect(plateX, plateY, plateW, plateH);
            ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(plateX + 12, plateY + 12, plateW - 24, plateH - 24);

            ctx.textAlign = 'center';
            ctx.fillStyle = accentColor;
            ctx.font = 'bold 28px serif';
            ctx.fillText('OFFICIAL MARITIME EXPEDITION RECORD', cx, plateY + 140);
            ctx.fillStyle = primaryColor;
            ctx.font = 'bold 56px serif';
            ctx.fillText(island.name, cx, plateY + 240);
            ctx.fillStyle = secondaryColor;
            ctx.font = '26px monospace';
            ctx.fillText(`COORDINATES: ${island.coordinates || 'JAPAN ARCHIPELAGO'}`, cx, plateY + 320);
            ctx.fillText(`PREFECTURE: ${island.prefecture || '日本'}`, cx, plateY + 375);
          }

          // Seal Stamp (Bottom-Right Wax Seal)
          const sealX = width - 180;
          const sealY = height - 190;
          const sealRadius = 75;

          // Seal 3D Drop Shadow
          ctx.beginPath();
          ctx.arc(sealX + 4, sealY + 4, sealRadius, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
          ctx.fill();

          // Outer Ring
          ctx.beginPath();
          ctx.arc(sealX, sealY, sealRadius, 0, Math.PI * 2);
          ctx.fillStyle = '#991B1B';
          ctx.fill();
          ctx.strokeStyle = '#E11D48';
          ctx.lineWidth = 5;
          ctx.stroke();

          // Inner Ring
          ctx.beginPath();
          ctx.arc(sealX, sealY, sealRadius - 10, 0, Math.PI * 2);
          ctx.strokeStyle = '#FCA5A5';
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 22px serif';
          ctx.fillText('KIRATABI', sealX, sealY - 12);
          ctx.font = 'bold 26px serif';
          ctx.fillText('公認証明', sealX, sealY + 18);

          // Serial Number (Bottom-Left)
          const displaySerial = assignedSerial || `No.0001`;
          ctx.textAlign = 'left';
          ctx.fillStyle = secondaryColor;
          ctx.font = '24px monospace';
          ctx.fillText(`SERIAL: ${displaySerial}`, 90, height - 90);

        } else {
          // 📄 【横型テンプレート】 ISO A4 Print Paper 1.414:1 (1414 x 1000 px)
          ctx.textAlign = 'center';

          // Headers
          ctx.fillStyle = secondaryColor;
          ctx.font = 'bold 22px serif';
          ctx.fillText(hasHologram ? 'VERIFIED PHOTO DIARY RECORD' : 'VERIFIED RECORD OF ARRIVAL', cx, 110);
          
          ctx.fillStyle = accentColor;
          ctx.font = 'bold 52px serif';
          ctx.fillText(certificateType === 'card' ? '到 達 証' : '島 旅 到 達 公 認 証', cx, 180);

          // Name Ribbon Plate
          const nameY = 300;
          const bannerGrad = ctx.createLinearGradient(cx - 300, 0, cx + 300, 0);
          bannerGrad.addColorStop(0, 'rgba(212, 175, 55, 0.05)');
          bannerGrad.addColorStop(0.5, 'rgba(212, 175, 55, 0.25)');
          bannerGrad.addColorStop(1, 'rgba(212, 175, 55, 0.05)');
          ctx.fillStyle = bannerGrad;
          ctx.fillRect(cx - 300, nameY - 40, 600, 68);

          ctx.strokeStyle = '#D4AF37';
          ctx.lineWidth = 2;
          ctx.strokeRect(cx - 300, nameY - 40, 600, 68);
          ctx.strokeStyle = '#F59E0B';
          ctx.lineWidth = 1;
          ctx.strokeRect(cx - 294, nameY - 34, 588, 56);

          ctx.fillStyle = primaryColor;
          ctx.font = 'bold 44px serif';
          ctx.fillText((travelerName || 'Voyager') + ' 殿', cx, nameY + 10);

          // Island Info
          const infoY = 410;
          const diff = getIslandDifficulty(island);
          ctx.fillStyle = accentColor;
          ctx.font = 'bold 28px sans-serif';
          ctx.fillText(`【 到達島 】 ${island.name} (${island.region_id || 'Japan'})`, cx, infoY);
          
          ctx.fillStyle = designTheme === 'modern' ? '#38BDF8' : '#F59E0B';
          ctx.font = 'bold 22px sans-serif';
          ctx.fillText(`【 冒険難易度 】 ${diff.stars} (${diff.shortLabel})`, cx, infoY + 45);

          ctx.fillStyle = secondaryColor;
          ctx.font = '20px monospace';
          ctx.fillText(`DATE OF ARRIVAL: ${visitDate}`, cx, infoY + 88);

          // Hero Image (Smart 縦写真 & 横写真 自動対応 / 写真未設定時は公式海図エンブレム)
          if (heroImg) {
            ctx.save();
            const isPortraitPhoto = heroImg.height > heroImg.width;
            const heroW = isPortraitPhoto ? 340 : 640;
            const heroH = isPortraitPhoto ? 380 : 330;
            const heroX = cx - heroW / 2;
            const heroY = 560;

            ctx.beginPath();
            ctx.rect(heroX, heroY, heroW, heroH);
            ctx.clip();

            const scale = Math.max(heroW / heroImg.width, heroH / heroImg.height);
            const dw = heroImg.width * scale;
            const dh = heroImg.height * scale;
            ctx.drawImage(heroImg, heroX + (heroW - dw) / 2, heroY + (heroH - dh) / 2, dw, dh);
            ctx.restore();

            // Gold Frame
            ctx.strokeStyle = accentColor;
            ctx.lineWidth = 6;
            ctx.strokeRect(heroX, heroY, heroW, heroH);
            ctx.strokeStyle = '#F59E0B';
            ctx.lineWidth = 2;
            ctx.strokeRect(heroX - 6, heroY - 6, heroW + 12, heroH + 12);
          } else {
            const plateW = 640;
            const plateH = 300;
            const plateX = cx - plateW / 2;
            const plateY = 565;
            ctx.fillStyle = 'rgba(15, 23, 42, 0.55)';
            ctx.fillRect(plateX, plateY, plateW, plateH);
            ctx.strokeStyle = accentColor;
            ctx.lineWidth = 4;
            ctx.strokeRect(plateX, plateY, plateW, plateH);
            ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(plateX + 10, plateY + 10, plateW - 20, plateH - 20);

            ctx.textAlign = 'center';
            ctx.fillStyle = accentColor;
            ctx.font = 'bold 18px serif';
            ctx.fillText('OFFICIAL MARITIME EXPEDITION RECORD', cx, plateY + 75);
            ctx.fillStyle = primaryColor;
            ctx.font = 'bold 38px serif';
            ctx.fillText(`${island.prefecture || ''} ${island.name}`, cx, plateY + 150);
            ctx.fillStyle = secondaryColor;
            ctx.font = '18px monospace';
            ctx.fillText(`COORDINATES: ${island.coordinates || 'JAPAN ARCHIPELAGO'}`, cx, plateY + 215);
            ctx.fillText('KIRATABI VERIFIED ARCHIPELAGO ARCHIVE', cx, plateY + 250);
          }

          // Seal Stamp (Bottom-Right Wax Seal)
          const sealX = width - 180;
          const sealY = height - 160;
          const sealRadius = 65;

          ctx.beginPath();
          ctx.arc(sealX + 3, sealY + 3, sealRadius, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
          ctx.fill();

          ctx.beginPath();
          ctx.arc(sealX, sealY, sealRadius, 0, Math.PI * 2);
          ctx.fillStyle = '#991B1B';
          ctx.fill();
          ctx.strokeStyle = '#E11D48';
          ctx.lineWidth = 5;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(sealX, sealY, sealRadius - 8, 0, Math.PI * 2);
          ctx.strokeStyle = '#FCA5A5';
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 18px serif';
          ctx.fillText('KIRATABI', sealX, sealY - 12);
          ctx.font = 'bold 22px serif';
          ctx.fillText('公認証明', sealX, sealY + 14);

          // Serial Number (Bottom-Left)
          const displaySerial = assignedSerial || `No.0001`;
          ctx.textAlign = 'left';
          ctx.fillStyle = secondaryColor;
          ctx.font = '18px monospace';
          ctx.fillText(`SERIAL: ${displaySerial}`, 80, height - 60);
        }
      };

      const verifiedPhotos = getVerifiedIslandPhotos(island);
      const verifiedFallbackUrl =
        orientation === 'vertical'
          ? (verifiedPhotos.mobileUrl || verifiedPhotos.desktopUrl)
          : (verifiedPhotos.desktopUrl || verifiedPhotos.mobileUrl);
      const activePhotoSrc = customImage || tempCheckInPhotoUrl || verifiedFallbackUrl || null;

      if (activePhotoSrc) {
        const img = new Image();
        if (!activePhotoSrc.startsWith('data:') && !activePhotoSrc.startsWith('blob:')) {
          img.crossOrigin = 'anonymous';
        }
        img.onload = () => {
          if (seq !== renderSeqRef.current) return;
          renderContent(ctx, img);
        };
        img.onerror = () => {
          if (seq !== renderSeqRef.current) return;
          renderContent(ctx, undefined);
        };
        img.src = activePhotoSrc;
      } else {
        renderContent(ctx, undefined);
      }
    };

    const seq = ++renderSeqRef.current;
    drawToCanvas(canvasRef.current);
    if (isFullscreenPreview) {
      drawToCanvas(fullscreenCanvasRef.current);
    }
  }, [island, anniversaryMode, travelerName, visitDate, hasHologram, includeCompanionStamp, companionChar, companionStage, customImage, tempCheckInPhotoUrl, certificateType, orientation, designTheme, isFullscreenPreview, assignedSerial]);

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

  // Handle Download (Safari / Mobile / Desktop 完全対応)
  const handleDownload = async () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error('証明書キャンバスの準備中です。もう一度お試しください。');
      return;
    }

    const safeIslandName = (island?.name || 'Island').replace(/[\\/:*?"<>|]/g, '_');
    const safeDate = (visitDate || '').replace(/[^0-9]/g, '');
    const fileName = `KIRATABI_Certificate_${safeIslandName}${safeDate ? '_' + safeDate : ''}.png`;

    const triggerDownloadLink = (href: string, revokeAfterMs = 0) => {
      const link = document.createElement('a');
      link.download = fileName;
      link.href = href;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
        if (revokeAfterMs > 0) {
          URL.revokeObjectURL(href);
        }
      }, revokeAfterMs || 500);
    };

    try {
      const blob = await new Promise<Blob | null>((resolve) => {
        try {
          canvas.toBlob((b) => resolve(b), 'image/png', 1.0);
        } catch {
          resolve(null);
        }
      });

      if (blob) {
        const blobUrl = URL.createObjectURL(blob);
        triggerDownloadLink(blobUrl, 15000);
        toast.success('📸 到達証明書をダウンロードしました！');
      } else {
        const dataUrl = canvas.toDataURL('image/png');
        triggerDownloadLink(dataUrl, 0);
        toast.success('📸 到達証明書をダウンロードしました！');
      }

      if (!issuedTypes.includes(certificateType)) {
        issueDigital(certificateType);
      }
    } catch (e) {
      console.error('Download error:', e);
      try {
        const dataUrl = canvas.toDataURL('image/png');
        triggerDownloadLink(dataUrl, 0);
        toast.success('📸 到達証明書をダウンロードしました！');
      } catch (err) {
        console.error('Fallback toDataURL error:', err);
        setErrorMessage('画像の保存に失敗しました。別の写真でお試しください。');
        toast.error('画像の保存に失敗しました。');
      }
    }
  };

  // Handle Web Share API & Twitter/X Direct Share
  const handleNativeShare = async () => {
    const text = `【キラ旅 到達証明】\n日本の離島「${island?.name}」への到達を正式証明！到達証明書を獲得しました 🏝️✨\n\n#キラ旅 #${island?.name || '離島'}到達証明書 #離島旅 #キラ旅島専科`;
    const shareUrl = window.location.origin ? `${window.location.origin}/island/${island?.id}` : `https://app.kira-tabi.com/island/${island?.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `【キラ旅】${island?.name} 到達証明書`,
          text: text,
          url: shareUrl
        });
      } catch (err) {
        // Fallback to X if user cancels or share API fails
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
        window.open(twitterUrl, '_blank', 'noopener,noreferrer');
      }
    } else {
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
      window.open(twitterUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Handle Instagram specific instruction
  const handleInstagramShare = () => {
    toast('Instagramでシェアするには、まず画像をダウンロード（保存）し、Instagramアプリを開いて投稿してください。', { icon: '📸', duration: 4000 });
    handleDownload();
  };

  if (!isOpen || !island) return null;

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
                        <Camera className="w-4 h-4 text-amber-400 shrink-0" />
                        <input type="file" accept="image/*,.heic,.heif" onChange={handleImageUpload} className="text-xs text-slate-300 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-amber-500 file:text-slate-950 file:font-bold hover:file:bg-amber-400 cursor-pointer" />
                        {customImage && (
                          <button
                            onClick={() => {
                              setCustomImage(null);
                              setTempCheckInPhotoUrl(null);
                              if (island?.id) {
                                try {
                                  sessionStorage.removeItem(`kiratabi_checkin_photo_${island.id}`);
                                  localStorage.removeItem(`kiratabi_checkin_photo_${island.id}`);
                                } catch {}
                              }
                            }}
                            className="text-xs text-rose-400 hover:underline shrink-0"
                          >
                            写真を削除
                          </button>
                        )}
                      </div>
                      {uploadError && (
                        <p className="text-xs text-rose-400 font-bold">{uploadError}</p>
                      )}
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 transition-all duration-500">
                  <button
                    onClick={handleNativeShare}
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs tracking-wide flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
                  >
                    <Share2 className="w-4 h-4" />
                    シェア(X/LINE等)
                  </button>
                  <button
                    onClick={handleInstagramShare}
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 hover:from-pink-400 hover:to-yellow-400 text-white font-bold text-xs tracking-wide flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    Instagramへ
                  </button>
                  <button
                    onClick={handleDownload}
                    className="w-full py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs tracking-wide flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    画像DL(無料・即時保存)
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
                className="max-w-none w-auto max-h-none h-auto shadow-2xl border border-slate-800"
                style={{ width: '1200px', height: '900px', transform: 'scale(0.8)', transformOrigin: 'center' }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Official Sponsor / PR Issuance Overlay */}
      <AnimatePresence>
        {isPlayingAd && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[11000] bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-6"
          >
            <div className="absolute top-8 right-8 text-white font-mono text-sm bg-slate-900/80 px-4 py-2 rounded-xl border border-amber-500/30 shadow-lg">
              {adTimeLeft > 0 ? `証明書を生成中... 残り ${adTimeLeft}秒` : '生成完了！証明書を発行します...'}
            </div>
            
            {/* Official Sponsor & Premium PR Card */}
            <div className="w-full max-w-lg aspect-video bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-2xl overflow-hidden border border-amber-500/40 relative shadow-2xl p-6 flex flex-col items-center justify-center text-center">
              <span className="px-3 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-bold tracking-widest uppercase mb-3">
                KIRATABI OFFICIAL SPONSOR PR
              </span>
              <Sparkles className="w-12 h-12 mb-3 text-amber-400 animate-pulse" />
              <h2 className="text-xl sm:text-2xl font-bold font-serif text-white mb-2 tracking-wide">
                輝旅 島専科 プレミアムパスポート
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-md leading-relaxed">
                プレミアム会員なら待ち時間ゼロで高画質デジタル認定書を無制限発行。さらに特製の金箔調・公式紙証明書の郵送オーダーも承っております。
              </p>
              <div className="mt-6 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></div>
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
            
            {adTimeLeft === 0 && (
              <button 
                onClick={() => { setIsPlayingAd(false); issueDigital(certificateType); }}
                className="mt-8 px-6 py-2.5 bg-amber-500 text-slate-950 font-bold rounded-full hover:bg-amber-400 transition-colors shadow-lg"
              >
                公認到達証明書を受け取る
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
}
