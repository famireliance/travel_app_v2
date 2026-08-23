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
  const [isDigitalIssued, setIsDigitalIssued] = useState(false);
  const [isFullscreenPreview, setIsFullscreenPreview] = useState(false);
  const [hasIssuedToday, setHasIssuedToday] = useState(false);
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
      const issuedKey = `kiratabi_issued_${island.id}`;
      const lastIssuedDate = localStorage.getItem(issuedKey);
      const todayStr = new Date().toISOString().split('T')[0];
      
      if (lastIssuedDate === todayStr) {
        setHasIssuedToday(true);
        setIsDigitalIssued(true);
      } else {
        setHasIssuedToday(false);
        setIsDigitalIssued(false);
      }
    }
  }, [isOpen, island]);

  const handleDigitalIssueClick = (type?: string) => {
    if (!isPremium) {
      setIsPlayingAd(true);
      setAdTimeLeft(5);
    } else {
      issueDigital();
    }
  };

  const issueDigital = useCallback(async () => {
    if (!island) return;
    
    if (user) {
      try {
        const res = await fetch('/api/certificates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ islandId: island.id, userId: user.id })
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

    const issuedKey = `kiratabi_issued_${island.id}`;
    const todayStr = new Date().toISOString().split('T')[0];
    localStorage.setItem(issuedKey, todayStr);

    setHasIssuedToday(true);
    setIsDigitalIssued(true);
  }, [island, user]);

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
        issueDigital();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isPlayingAd, adTimeLeft, issueDigital]);

  // Mock Trial Status (Ideally fetched from Supabase profiles.trial_ends_at)
  const isTrialActive = true; 

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
      setIsDigitalIssued(false);
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
    const canvas = canvasRef.current;
    if (!canvas || !island) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 1200;
    const height = 900;

    const renderContent = (ctx: CanvasRenderingContext2D, heroImg?: HTMLImageElement) => {
      // ======================================================
      // 1周年記念特別版デザイン
      // ======================================================
      if (anniversaryMode) {
        // Deep navy background
        ctx.fillStyle = '#0A0F2E';
        ctx.fillRect(0, 0, width, height);

        // Midnight blue radial
        const grad = ctx.createRadialGradient(width / 2, height / 2, 80, width / 2, height / 2, 750);
        grad.addColorStop(0, '#1a2060');
        grad.addColorStop(0.5, '#0d1240');
        grad.addColorStop(1, '#060816');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Gold outer border (thick)
        ctx.strokeStyle = '#C9A84C';
        ctx.lineWidth = 14;
        ctx.strokeRect(25, 25, width - 50, height - 50);

        // Platinum inner border
        const platGrad = ctx.createLinearGradient(0, 0, width, height);
        platGrad.addColorStop(0, '#FFFFFF');
        platGrad.addColorStop(0.5, '#C0C0C0');
        platGrad.addColorStop(1, '#E8E8E8');
        ctx.strokeStyle = platGrad;
        ctx.lineWidth = 2.5;
        ctx.strokeRect(44, 44, width - 88, height - 88);

        // Corner ornaments — diamond shape
        const drawDiamond = (cx: number, cy: number) => {
          ctx.save();
          ctx.translate(cx, cy);
          ctx.beginPath();
          ctx.moveTo(0, -18); ctx.lineTo(18, 0); ctx.lineTo(0, 18); ctx.lineTo(-18, 0);
          ctx.closePath();
          ctx.fillStyle = '#C9A84C';
          ctx.fill();
          ctx.restore();
        };
        drawDiamond(44, 44); drawDiamond(width - 44, 44);
        drawDiamond(44, height - 44); drawDiamond(width - 44, height - 44);

        // Horizontal decorative lines with stars
        const drawStarLine = (y: number) => {
          ctx.strokeStyle = 'rgba(201,168,76,0.5)';
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(80, y); ctx.lineTo(width / 2 - 120, y); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(width / 2 + 120, y); ctx.lineTo(width - 80, y); ctx.stroke();
          ctx.fillStyle = '#C9A84C';
          ctx.font = '18px serif';
          ctx.textAlign = 'center';
          ctx.fillText('★', width / 2, y + 6);
        };
        drawStarLine(200);
        drawStarLine(height - 140);

        // Anniversary ribbon at top
        ctx.fillStyle = 'rgba(201,168,76,0.12)';
        ctx.fillRect(0, 55, width, 140);

        // Title area
        ctx.textAlign = 'center';
        const titleGrad = ctx.createLinearGradient(0, 80, 0, 130);
        titleGrad.addColorStop(0, '#FFFFFF');
        titleGrad.addColorStop(0.5, '#C9A84C');
        titleGrad.addColorStop(1, '#E8D5A3');
        ctx.fillStyle = titleGrad;
        ctx.font = 'bold 20px monospace';
        ctx.fillText('★★★ KIRATABI ULTIMATE 1ST ANNIVERSARY ★★★', width / 2, 95);

        ctx.fillStyle = '#E8D5A3';
        ctx.font = 'bold 50px serif';
        ctx.fillText('山 旅 到 達 記 念 証', width / 2, 170);

        // Subtitle
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.font = '18px sans-serif';
        ctx.fillText('ONE YEAR ULTIMATE MEMBER SPECIAL EDITION', width / 2, 215);

        // Body text
        ctx.fillStyle = '#CBD5E1';
        ctx.font = '26px sans-serif';
        ctx.fillText('以下の旅人が1周年を超える久しく島島を巡る旅を続け、', width / 2, 270);
        ctx.fillText('見事この地を蹏破したことをKIRATABIシステムにより特別公認する。', width / 2, 310);

        // Traveler Name
        ctx.fillStyle = 'rgba(201,168,76,0.2)';
        ctx.fillRect(width / 2 - 380, 345, 760, 85);
        ctx.strokeStyle = '#C9A84C';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(width / 2 - 380, 345, 760, 85);

        const nameGrad = ctx.createLinearGradient(0, 350, 0, 420);
        nameGrad.addColorStop(0, '#FFFFFF');
        nameGrad.addColorStop(1, '#E8D5A3');
        ctx.fillStyle = nameGrad;
        ctx.font = 'bold 46px serif';
        ctx.fillText(travelerName || 'Voyager', width / 2, 402);

        // Island name
        const diff = getIslandDifficulty(island);
        ctx.fillStyle = '#C9A84C';
        ctx.font = 'bold 26px sans-serif';
        ctx.fillText(`【 到達島 】 ${island.name} (${island.region_id || 'Japan'})`, width / 2, 472);
        ctx.fillStyle = '#94A3B8';
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText(`【 冠険難易度 】 ${diff.stars} (${diff.shortLabel})`, width / 2, 508);

        // Date
        ctx.fillStyle = '#64748B';
        ctx.font = '20px monospace';
        ctx.fillText(`DATE OF ARRIVAL: ${visitDate}`, width / 2, 545);

        // Hero Image
        if (heroImg) {
          ctx.save();
          const heroX = width / 2 - 220; const heroY = 568;
          const heroW = 440; const heroH = 180;
          ctx.beginPath(); ctx.rect(heroX, heroY, heroW, heroH); ctx.clip();
          const scale = Math.max(heroW / heroImg.width, heroH / heroImg.height);
          const dw = heroImg.width * scale; const dh = heroImg.height * scale;
          ctx.drawImage(heroImg, heroX + (heroW - dw) / 2, heroY + (heroH - dh) / 2, dw, dh);
          ctx.restore();
          ctx.strokeStyle = '#C9A84C'; ctx.lineWidth = 3;
          ctx.strokeRect(heroX, heroY, heroW, heroH);
        }

        // ANNIV Special Seal (platinum ring)
        const cx = width - 175; const cy = height - 165;
        ctx.beginPath(); ctx.arc(cx, cy, 68, 0, Math.PI * 2);
        const sealGrad = ctx.createLinearGradient(cx - 68, cy - 68, cx + 68, cy + 68);
        sealGrad.addColorStop(0, '#FFFFFF'); sealGrad.addColorStop(0.5, '#C9A84C'); sealGrad.addColorStop(1, '#E8D5A3');
        ctx.strokeStyle = sealGrad; ctx.lineWidth = 6; ctx.stroke();
        ctx.beginPath(); ctx.arc(cx, cy, 58, 0, Math.PI * 2); ctx.lineWidth = 1.5; ctx.stroke();
        ctx.fillStyle = '#C9A84C'; ctx.font = 'bold 13px serif';
        ctx.fillText('KIRATABI', cx, cy - 20);
        ctx.font = 'bold 16px serif'; ctx.fillText('ULTIMATE', cx, cy + 4);
        ctx.font = 'bold 12px monospace'; ctx.fillText('1ST ANNIV', cx, cy + 24);
        ctx.font = '11px monospace'; ctx.fillText('★ SPECIAL ★', cx, cy + 44);

        // Companion stamp (gold-tinted)
        if (includeCompanionStamp && companionChar && companionStage) {
          ctx.save();
          const bx = 68; const by = height - 195;
          ctx.fillStyle = 'rgba(10,15,46,0.9)'; ctx.fillRect(bx, by, 420, 88);
          ctx.strokeStyle = '#C9A84C'; ctx.lineWidth = 2; ctx.strokeRect(bx, by, 420, 88);
          ctx.beginPath(); ctx.arc(bx + 44, by + 44, 30, 0, Math.PI * 2);
          ctx.fillStyle = '#060816'; ctx.fill();
          ctx.strokeStyle = '#C9A84C'; ctx.lineWidth = 2; ctx.stroke();
          ctx.font = '30px sans-serif'; ctx.textAlign = 'center';
          ctx.fillText(companionStage.icon || '🐢', bx + 44, by + 54);
          ctx.textAlign = 'left';
          ctx.fillStyle = '#E8D5A3'; ctx.font = 'bold 14px sans-serif';
          ctx.fillText(`同行精霊: ${companionChar.name} (STAGE ${companionStage.stage})`, bx + 88, by + 28);
          ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 16px serif';
          ctx.fillText(`${companionStage.name}`, bx + 88, by + 52);
          ctx.fillStyle = '#C9A84C'; ctx.font = '11px monospace';
          ctx.fillText('【 守護精霊パートナー公認証 】', bx + 88, by + 74);
          ctx.restore();
        }

        // ANNIV serial
        const anniversarySerial = `ANNIV-${String(Math.abs(island.id?.split('').reduce((a: number, c: string) => a + c.charCodeAt(0), 0) ?? 0) % 9000 + 1000)}`;
        ctx.fillStyle = '#4A5568'; ctx.font = '16px monospace'; ctx.textAlign = 'left';
        ctx.fillText(`SERIAL: ${anniversarySerial}`, 80, height - 80);
        ctx.fillText(`VERIFY AT: https://island.kira-tabi.com`, 80, height - 55);

        return; // anniversaryMode end — skip normal rendering
      }

      // ======================================================
      // 通常版デザイン（以下変更なし）
      // ======================================================

      // Subtle radial glow
      const gradient = ctx.createRadialGradient(width / 2, height / 2, 100, width / 2, height / 2, 800);
      
      if (hasHologram) {
        // Holographic rare background
        gradient.addColorStop(0, '#3B0764'); // Deep Purple
        gradient.addColorStop(0.3, '#1E1B4B'); // Indigo
        gradient.addColorStop(0.6, '#064E3B'); // Emerald
        gradient.addColorStop(1, '#0F172A');
      } else {
        gradient.addColorStop(0, '#1E293B');
        gradient.addColorStop(1, '#0F172A');
      }
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Holographic Rainbow Overlay
      if (hasHologram) {
        const holoGradient = ctx.createLinearGradient(0, 0, width, height);
        holoGradient.addColorStop(0, 'rgba(236, 72, 153, 0.15)'); // Pink
        holoGradient.addColorStop(0.3, 'rgba(139, 92, 246, 0.15)'); // Violet
        holoGradient.addColorStop(0.7, 'rgba(14, 165, 233, 0.15)'); // Sky
        holoGradient.addColorStop(1, 'rgba(16, 185, 129, 0.15)'); // Emerald
        ctx.fillStyle = holoGradient;
        ctx.fillRect(0, 0, width, height);
      }

      // Outer Gold Border
      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 12;
      ctx.strokeRect(30, 30, width - 60, height - 60);

      // Inner Gold Fine Border
      ctx.lineWidth = 2;
      ctx.strokeRect(46, 46, width - 92, height - 92);

      // Corner Ornaments
      const drawCorner = (x: number, y: number, dx: number, dy: number) => {
        ctx.beginPath();
        ctx.moveTo(x, y + dy * 30);
        ctx.lineTo(x, y);
        ctx.lineTo(x + dx * 30, y);
        ctx.strokeStyle = '#F3E5AB';
        ctx.lineWidth = 4;
        ctx.stroke();
      };
      drawCorner(46, 46, 1, 1);
      drawCorner(width - 46, 46, -1, 1);
      drawCorner(46, height - 46, 1, -1);
      drawCorner(width - 46, height - 46, -1, -1);

      // Header Title
      ctx.fillStyle = hasHologram ? '#F472B6' : '#F3E5AB';
      ctx.font = 'bold 24px serif';
      ctx.textAlign = 'center';
      ctx.fillText(hasHologram ? 'KIRATABI VERIFIED PHOTO DIARY RECORD' : 'KIRATABI VERIFIED RECORD OF ARRIVAL', width / 2, 110);

      ctx.fillStyle = '#D4AF37';
      ctx.font = 'light 48px serif';
      ctx.fillText('島 旅 到 達 公 認 証', width / 2, 175);

      // Decorative Line
      ctx.beginPath();
      ctx.moveTo(width / 2 - 200, 205);
      ctx.lineTo(width / 2 + 200, 205);
      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Body Text
      ctx.fillStyle = '#E2E8F0';
      ctx.font = '28px sans-serif';
      ctx.fillText('以下の旅人が日本諸島を巡る旅において、', width / 2, 270);
      ctx.fillText('見事この地を踏破・到達したことをKIRATABIシステムにより公認する。', width / 2, 315);

      // Traveler Name Highlight Box
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fillRect(width / 2 - 350, 350, 700, 80);
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
      ctx.lineWidth = 1;
      ctx.strokeRect(width / 2 - 350, 350, 700, 80);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 44px serif';
      ctx.fillText(travelerName || 'Voyager', width / 2, 405);

      // Island Name & Region & Difficulty
      const diff = getIslandDifficulty(island);
      ctx.fillStyle = '#D4AF37';
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText(`【 到達島 】 ${island.name} (${island.region_id || 'Japan'})`, width / 2, 475);

      ctx.fillStyle = '#F59E0B';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText(`【 冒険難易度 】 ${diff.stars} (${diff.shortLabel})`, width / 2, 515);

      // Date
      ctx.fillStyle = '#94A3B8';
      ctx.font = '22px monospace';
      ctx.fillText(`DATE OF ARRIVAL: ${visitDate}`, width / 2, 555);

      // Hero Image Area
      if (heroImg) {
        ctx.save();
        const heroX = width / 2 - 220;
        const heroY = 585;
        const heroW = 440;
        const heroH = 190;

        ctx.beginPath();
        ctx.rect(heroX, heroY, heroW, heroH);
        ctx.clip();

        const scale = Math.max(heroW / heroImg.width, heroH / heroImg.height);
        const dw = heroImg.width * scale;
        const dh = heroImg.height * scale;
        const dx = heroX + (heroW - dw) / 2;
        const dy = heroY + (heroH - dh) / 2;
        ctx.drawImage(heroImg, dx, dy, dw, dh);
        ctx.restore();

        ctx.strokeStyle = '#D4AF37';
        ctx.lineWidth = 3;
        ctx.strokeRect(heroX, heroY, heroW, heroH);
      }

      // Draw Stamp / Seal (Bottom Right)
      const centerX = width - 180;
      const centerY = height - 180;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 65, 0, Math.PI * 2);
      ctx.strokeStyle = '#E11D48'; // Official Red Seal color
      ctx.lineWidth = 5;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(centerX, centerY, 57, 0, Math.PI * 2);
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#E11D48';
      ctx.font = 'bold 18px serif';
      ctx.fillText('KIRATABI', centerX, centerY - 15);
      ctx.font = 'bold 22px serif';
      ctx.fillText('公認証明', centerX, centerY + 15);
      ctx.font = '14px monospace';
      ctx.fillText('VERIFIED', centerX, centerY + 38);

      // Draw Companion Character Stamp & Emblem Box (Bottom Left/Center) if checked
      if (includeCompanionStamp && companionChar && companionStage) {
        ctx.save();
        const compX = 80;
        const compY = height - 195;
        const compW = 420;
        const compH = 88;

        // Background box
        ctx.fillStyle = 'rgba(30, 41, 59, 0.9)';
        ctx.fillRect(compX, compY, compW, compH);
        ctx.strokeStyle = '#D4AF37';
        ctx.lineWidth = 2;
        ctx.strokeRect(compX, compY, compW, compH);

        // Character Icon circle
        ctx.beginPath();
        ctx.arc(compX + 44, compY + 44, 30, 0, Math.PI * 2);
        ctx.fillStyle = '#0F172A';
        ctx.fill();
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.font = '32px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(companionStage.icon || '🐢', compX + 44, compY + 54);

        // Character Texts
        ctx.textAlign = 'left';
        ctx.fillStyle = '#F3E5AB';
        ctx.font = 'bold 15px sans-serif';
        ctx.fillText(`同行精霊: ${companionChar.name} (STAGE ${companionStage.stage})`, compX + 88, compY + 28);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 17px serif';
        ctx.fillText(`${companionStage.name}`, compX + 88, compY + 52);

        ctx.fillStyle = '#38BDF8';
        ctx.font = '12px monospace';
        ctx.fillText(`【 守護精霊パートナー公認証 】`, compX + 88, compY + 74);
        ctx.restore();
      }

    const serialText = assignedSerial || getFormattedSerial(island.id || island.name);
      ctx.fillStyle = '#64748B';
      ctx.font = '18px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`SERIAL: ${serialText}`, 80, height - 80);
      ctx.fillText(`VERIFY AT: https://travelappv2-two.vercel.app`, 80, height - 55);
    };

    const applyToCanvas = (c: HTMLCanvasElement | null, imgObj?: HTMLImageElement) => {
      if (!c) return;
      const context = c.getContext('2d');
      if (context) {
        c.width = width;
        c.height = height;
        renderContent(context, imgObj);
      }
    };

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      applyToCanvas(canvasRef.current, img);
      applyToCanvas(fullscreenCanvasRef.current, img);
    };
    img.onerror = () => {
      // Keep canvas with default drawn content if image fails
      applyToCanvas(canvasRef.current);
      applyToCanvas(fullscreenCanvasRef.current);
    };
    img.src = customImage || island?.image_url || '/region/tropical.jpg';
  }, [island, travelerName, visitDate, customImage, assignedSerial, includeCompanionStamp, companionChar, companionStage, hasHologram]);

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
    alert('Instagramでシェアするには、まず画像をダウンロード（保存）し、Instagramアプリを開いて投稿してください。');
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
                <div className="space-y-4 bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-amber-400" /> 旅人ネーム (証明書に印字)
                      </label>
                      <input
                        type="text"
                        value={travelerName}
                        onChange={(e) => {
                          setTravelerName(e.target.value);
                          updateTravelerName(e.target.value);
                        }}
                        placeholder="お名前またはハンドルネーム"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-amber-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-amber-400" /> 到達日
                      </label>
                      <input
                        type="text"
                        value={visitDate}
                        onChange={(e) => setVisitDate(e.target.value)}
                        placeholder="YYYY.MM.DD"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-amber-500 transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-amber-400" /> カスタム写真アップロード (ヒーローエリアに反映)
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="w-full text-xs text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-amber-400 hover:file:bg-slate-700 transition-all"
                      />
                      {customImage && (
                        <button
                          type="button"
                          onClick={() => setCustomImage(null)}
                          className="text-xs text-rose-400 hover:text-rose-300 underline shrink-0"
                        >
                          削除
                        </button>
                      )}
                    </div>
                    {uploadError && (
                      <p className="text-xs text-rose-400 mt-1 font-semibold">{uploadError}</p>
                    )}
                    
                    {/* 守護精霊パートナー刻印チェックボックス */}
                    {companionChar && companionStage && (
                      <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between">
                        <label className="flex items-center gap-2.5 cursor-pointer select-none text-xs text-slate-300 hover:text-white transition-colors">
                          <input
                            type="checkbox"
                            checked={includeCompanionStamp}
                            onChange={(e) => setIncludeCompanionStamp(e.target.checked)}
                            className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-slate-800 border-slate-600"
                          />
                          <span className="font-bold text-amber-400 flex items-center gap-1.5">
                            <span>{companionStage.icon}</span>
                            <span>同行精霊「{companionChar.name} (STAGE {companionStage.stage})」を認定証＆公式カードに刻印する</span>
                          </span>
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {/* Canvas Preview Box */}
                <div className="flex flex-col items-center relative">
                  <div className="w-full flex items-center justify-between mb-3">
                    <p className="text-xs text-slate-400 tracking-widest uppercase flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" /> プレビュー (リアルタイム)
                    </p>
                    <button 
                      onClick={() => setIsFullscreenPreview(true)}
                      className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1"
                    >
                      拡大表示
                    </button>
                  </div>
                  <div className="w-full bg-slate-950 p-3 rounded-2xl border border-slate-700/60 shadow-inner overflow-hidden flex justify-center relative cursor-zoom-in" onClick={() => setIsFullscreenPreview(true)}>
                    <canvas
                      ref={canvasRef}
                      className={`w-full max-w-[640px] h-auto rounded-lg shadow-2xl border border-slate-800 transition-all duration-1000 ${!isDigitalIssued ? 'blur-sm grayscale opacity-80' : ''}`}
                    />
                    {!isDigitalIssued && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/40 backdrop-blur-sm z-10 p-6 rounded-2xl pointer-events-none">
                        {!user ? (
                          <div className="bg-white p-6 rounded-2xl shadow-xl text-center max-w-sm pointer-events-auto">
                            <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <h4 className="font-bold text-slate-800 mb-2">ログインが必要です</h4>
                            <p className="text-xs text-slate-500 mb-4">公式認定デジタル証明書を発行・保存するには、無料のユーザー登録が必要です。</p>
                            <button onClick={onClose} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl">
                              閉じてログイン画面へ
                            </button>
                          </div>
                        ) : limitReachedError ? (
                          <div className="bg-white p-6 rounded-2xl shadow-xl text-center max-w-sm border-2 border-red-400 pointer-events-auto">
                            <h4 className="font-bold text-slate-800 mb-2 font-serif text-lg">無料枠の上限に達しました</h4>
                            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                              {limitErrorMessage}
                            </p>
                            <button 
                              onClick={() => { onClose(); /* Optionally navigate to upgrade page */ }}
                              className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-900 font-bold text-sm rounded-xl shadow-lg"
                            >
                              プランを確認する
                            </button>
                          </div>
                        ) : isPremium ? (
                          <div className="bg-white p-6 rounded-2xl shadow-xl text-center max-w-sm border-2 border-amber-400 pointer-events-auto">
                            <Sparkles className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                            <h4 className="font-bold text-slate-800 mb-2 font-serif text-lg">公式証明書を発行します</h4>
                            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                              用途に合わせて発行する証明書のタイプを選択してください。
                            </p>
                            <div className="flex flex-col gap-2">
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleDigitalIssueClick('card'); }}
                                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-colors border border-slate-200"
                              >
                                【無料・無制限】簡易カード版を発行
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleDigitalIssueClick('high_quality'); }}
                                className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-900 font-bold text-sm rounded-xl shadow-lg transition-colors flex items-center justify-center gap-1.5"
                              >
                                <Sparkles className="w-4 h-4" /> 公式高画質版を発行 (Free:1枚/Premium:月5枚)
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-white p-6 rounded-2xl shadow-xl text-center max-w-sm border border-slate-200 pointer-events-auto">
                            <Award className="w-12 h-12 text-blue-500 mx-auto mb-3" />
                            <h4 className="font-bold text-slate-800 mb-2 font-serif text-lg">公式証明書を発行します</h4>
                            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                              用途に合わせて発行する証明書のタイプを選択してください。
                            </p>
                            <div className="flex flex-col gap-2">
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleDigitalIssueClick('card'); }}
                                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-colors border border-slate-200"
                              >
                                【無料・無制限】簡易カード版を発行
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleDigitalIssueClick('high_quality'); }}
                                className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-900 font-bold text-sm rounded-xl shadow-lg transition-colors flex items-center justify-center gap-1.5"
                              >
                                <Sparkles className="w-4 h-4" /> 公式高画質版を発行 (Free:1枚/Premium:月5枚)
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Viral & Free Download Actions */}
                <div className={`grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 transition-all duration-500 ${!isDigitalIssued ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
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
                      {orderSubmitting ? '処理中...' : '決済へ進む (Stripeデモ / 連番シリアル確定)'}
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
                        <span>受付番号:</span>
                        <strong className="text-amber-400 font-mono">ORD-2026-0001</strong>
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
                className={`max-w-none w-auto max-h-none h-auto shadow-2xl border border-slate-800 ${!isDigitalIssued ? 'blur-sm grayscale opacity-80' : ''}`}
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
                onClick={() => { setIsPlayingAd(false); issueDigital(); }}
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
