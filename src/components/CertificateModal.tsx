'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Download,
  Share2,
  Award,
  Camera,
  CheckCircle,
  Sparkles,
  Send,
  Calendar,
  User,
  RefreshCw,
  Lock,
  Smartphone,
  Crown,
  Loader2,
  Ticket,
  ExternalLink,
} from 'lucide-react';
import imageCompression from 'browser-image-compression';

import { useTravel } from '@/context/TravelContext';
import { getIslandDifficulty } from '@/lib/difficulty';
import { getVerifiedIslandPhotos } from '@/lib/islandPhoto';
import { drawOfficialSquareHanko, drawOfficialMedallionSeal } from '@/lib/officialSeal';
import { ALL_ISLANDS_MASTER_DICTIONARY } from '@/data/allIslandsMaster';
import regionsData from '@/data/regions.json';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import AuthModal from './AuthModal';
import { PlanChangeModal } from './PlanChangeModal';

interface ActiveSponsorInfo {
  id: string;
  name: string;
  type: string;
  category_detail: string;
  logo_url: string;
  banner_photo_url: string;
  official_website_url: string;
  perk_text: string;
  sponsor_tier: string;
}

function isValidSponsorMediaOrUrl(raw?: string | null): raw is string {
  if (!raw || typeof raw !== 'string') return false;
  const trimmed = raw.trim();
  return trimmed.startsWith('https://') || (trimmed.startsWith('/') && !trimmed.startsWith('//'));
}

interface ServerCertificateRecord {
  id: string;
  island_id: string;
  user_id: string;
  serial_number: number;
  type: 'card' | 'standard' | 'high_quality';
  image_url: string | null;
  created_at: string;
}

interface CertificateQuotaInfo {
  highQualityMonthlyLimit: number | null;
  highQualityMonthlyUsed: number;
  highQualityRemaining: number | null;
  cardDailyLimit: number | null;
  cardDailyUsed: number;
  cardDailyRemaining: number | null;
}

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  island: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user?: any;
  anniversaryMode?: boolean;
  initialCertificateType?: 'card' | 'high_quality';
  onIssuedOrUpdated?: (cert: ServerCertificateRecord) => void;
}

async function loadCorsSafeImage(src: string): Promise<HTMLImageElement | undefined> {
  if (!src) return undefined;

  if (src.startsWith('data:') || src.startsWith('blob:') || src.startsWith('/')) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(undefined);
      img.src = src;
    });
  }

  // Remote http(s) URL: fetch as CORS blob first so cached non-CORS <img> entries
  // on iOS Safari / Android Chrome NEVER taint the HTML5 <canvas>!
  try {
    const res = await fetch(src, { mode: 'cors', cache: 'reload' });
    if (!res.ok) return undefined;
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    return await new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(undefined);
      };
      img.src = objectUrl;
    });
  } catch {
    return undefined;
  }
}

function buildCertificateFilename(islandName: string | undefined, visitDate: string, type: 'card' | 'high_quality', serial?: string): string {
  const safeIslandName = (islandName || 'Island').replace(/[\\/:*?"<>|\s]/g, '_');
  const safeDate = (visitDate || '').replace(/[^0-9]/g, '');
  const serialPart = serial && serial.startsWith('No.') ? `_${serial.replace('.', '')}` : '';
  const suffix = type === 'high_quality' ? '_HQ' : '_Card';
  return `KIRATABI_Certificate_${safeIslandName}${serialPart}${safeDate ? '_' + safeDate : ''}${suffix}.png`;
}

export default function CertificateModal({
  isOpen,
  onClose,
  island,
  user: userProp,
  anniversaryMode = false,
  initialCertificateType,
  onIssuedOrUpdated,
}: CertificateModalProps) {
  const {
    user: contextUser,
    travelerName: contextTravelerName,
    updateTravelerName,
    islandStatuses,
    tempCheckInPhotoUrl,
    setTempCheckInPhotoUrl,
    tempCheckInDate,
    subscriptionTier,
  } = useTravel();

  const user = userProp || contextUser;
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);

  const localStatus = island
    ? islandStatuses[String(island.id)] ||
      (island.slug ? islandStatuses[String(island.slug)] : undefined) ||
      'none'
    : 'none';

  const [serverTier, setServerTier] = useState<'free' | 'premium' | 'ultimate' | null>(null);
  const effectiveTier: 'free' | 'premium' | 'ultimate' =
    serverTier || (subscriptionTier as 'free' | 'premium' | 'ultimate') || 'free';
  const isPremium = effectiveTier === 'premium' || effectiveTier === 'ultimate';

  const [serverHasVisited, setServerHasVisited] = useState(false);
  const [serverTickets, setServerTickets] = useState(0);
  const [serverQuota, setServerQuota] = useState<CertificateQuotaInfo | null>(null);
  const [issuedCertMap, setIssuedCertMap] = useState<{
    card?: ServerCertificateRecord;
    high_quality?: ServerCertificateRecord;
  }>({});
  const [isLoadingQuota, setIsLoadingQuota] = useState(false);

  const hasVisitedIsland =
    localStatus === 'visited' ||
    localStatus === 'verified_visited' ||
    serverHasVisited ||
    Boolean(issuedCertMap.card || issuedCertMap.high_quality);

  const [travelerName, setTravelerName] = useState<string>('');
  const [visitDate, setVisitDate] = useState<string>('');
  const [customImage, setCustomImage] = useState<string | null>(null);
  const isVerified =
    localStatus === 'verified_visited' || Boolean(tempCheckInPhotoUrl) || Boolean(customImage);

  const [uploadError, setUploadError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderPlan, setOrderPlan] = useState<
    'standard' | 'bundle_3' | 'frame_simple' | 'frame_wood' | 'frame_acrylic'
  >('standard');
  const [bundleIsland2, setBundleIsland2] = useState('');
  const [bundleIsland3, setBundleIsland3] = useState('');
  const [orderDesign, setOrderDesign] = useState<'horizontal' | 'vertical'>('horizontal');
  const [isLaminated, setIsLaminated] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  // Active local sponsor CM & Ticket Pack checkout state
  const [activeSponsor, setActiveSponsor] = useState<ActiveSponsorInfo | null>(null);
  const [buyingTicketPack, setBuyingTicketPack] = useState<'pack_3' | 'pack_10' | null>(null);

  const visitedIslandOptions = useMemo(() => {
    const names = new Set<string>();
    const currentName = String(island?.name || '').trim();
    Object.entries(islandStatuses || {}).forEach(([key, st]) => {
      if (st !== 'visited' && st !== 'verified_visited') return;
      const trimmed = key.trim();
      if (!trimmed) return;
      const lower = trimmed.toLowerCase();
      const found =
        ALL_ISLANDS_MASTER_DICTIONARY[trimmed] ||
        Object.values(ALL_ISLANDS_MASTER_DICTIONARY).find(
          (m) => m.slug === lower || m.name === trimmed
        );
      const label = String(found?.name || trimmed).trim();
      if (label && label !== currentName) {
        names.add(label);
      }
    });
    return Array.from(names);
  }, [islandStatuses, island?.name]);

  // Mailing Form Fields
  const [recipientCountry, setRecipientCountry] = useState('Japan');
  const [recipientName, setRecipientName] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [address, setAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const [assignedSerial, setAssignedSerial] = useState('No.----');
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [certificateType, setCertificateType] = useState<'card' | 'high_quality'>(
    initialCertificateType || 'high_quality'
  );
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  const [designTheme, setDesignTheme] = useState<'classic' | 'modern' | 'vintage'>('classic');
  const [isFullscreenPreview, setIsFullscreenPreview] = useState(false);

  // Issuance / Ad / Save state
  const [isPlayingAd, setIsPlayingAd] = useState(false);
  const [adTimeLeft, setAdTimeLeft] = useState(0);
  const [isIssuingServer, setIsIssuingServer] = useState(false);
  const [justIssuedCert, setJustIssuedCert] = useState<ServerCertificateRecord | null>(null);
  const [showSaveGuidePanel, setShowSaveGuidePanel] = useState(false);
  const [latestPreviewDataUrl, setLatestPreviewDataUrl] = useState<string | null>(null);
  const [hasHologram, setHasHologram] = useState(false);
  const [limitErrorMessage, setLimitErrorMessage] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fullscreenCanvasRef = useRef<HTMLCanvasElement>(null);
  const renderSeqRef = useRef<number>(0);
  const initializedIslandKeyRef = useRef<string>('');
  const latestPngBlobRef = useRef<Blob | null>(null);
  const latestPngFileRef = useRef<File | null>(null);
  const isMobileDevice =
    typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  // Active issued record for currently selected certificateType
  const activeIssuedCert =
    certificateType === 'high_quality' ? issuedCertMap.high_quality : issuedCertMap.card;

  const isHighQualityQuotaExhausted =
    !issuedCertMap.high_quality &&
    effectiveTier !== 'ultimate' &&
    serverQuota !== null &&
    serverQuota.highQualityRemaining !== null &&
    serverQuota.highQualityRemaining <= 0 &&
    serverTickets <= 0;

  const isCardDailyQuotaExhausted =
    !issuedCertMap.card &&
    effectiveTier === 'free' &&
    serverQuota !== null &&
    serverQuota.cardDailyRemaining !== null &&
    serverQuota.cardDailyRemaining <= 0;

  const isCurrentSelectionLocked =
    !hasVisitedIsland ||
    !user ||
    (certificateType === 'high_quality' && isHighQualityQuotaExhausted) ||
    (certificateType === 'card' && isCardDailyQuotaExhausted);

  // Check diary photo for hologram eligibility
  useEffect(() => {
    if (isOpen && island && user) {
      if (tempCheckInPhotoUrl || customImage) {
        setHasHologram(true);
      } else {
        supabase
          .from('island_diaries')
          .select('photo_url')
          .eq('island_id', island.id)
          .eq('user_id', user.id)
          .not('photo_url', 'is', null)
          .limit(1)
          .then(({ data }) => {
            setHasHologram(Boolean(data && data.length > 0));
          });
      }
    } else {
      setHasHologram(false);
    }
  }, [isOpen, island, user, tempCheckInPhotoUrl, customImage]);

  // Fetch authoritative server quota & existing issued certificates on modal open
  const refreshServerCertificateState = useCallback(
    async (autoSelectType = false) => {
      if (!island || !user) {
        setIssuedCertMap({});
        setServerQuota(null);
        setServerHasVisited(false);
        setActiveSponsor(null);
        return;
      }
      setIsLoadingQuota(true);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const token = session?.access_token || '';
        if (!token) {
          setIsLoadingQuota(false);
          return;
        }
        const res = await fetch(
          `/api/certificates?islandId=${encodeURIComponent(String(island.id))}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store',
          }
        );
        if (!res.ok) {
          setIsLoadingQuota(false);
          return;
        }
        const data = await res.json();
        if (data.tier) setServerTier(data.tier);
        if (typeof data.tickets === 'number') setServerTickets(data.tickets);
        if (data.quota) setServerQuota(data.quota);
        setServerHasVisited(Boolean(data.hasVisited));
        setActiveSponsor(data.activeSponsor || null);

        const nextMap: { card?: ServerCertificateRecord; high_quality?: ServerCertificateRecord } = {};
        for (const row of (data.existingCertificates || []) as ServerCertificateRecord[]) {
          if (row.type === 'high_quality' && !nextMap.high_quality) {
            nextMap.high_quality = row;
          } else if ((row.type === 'card' || row.type === 'standard') && !nextMap.card) {
            nextMap.card = row;
          }
        }
        setIssuedCertMap(nextMap);

        if (autoSelectType) {
          if (initialCertificateType) {
            setCertificateType(initialCertificateType);
          } else if (nextMap.high_quality) {
            setCertificateType('high_quality');
          } else {
            const hqRem = data.quota?.highQualityRemaining;
            const tk = Number(data.tickets || 0);
            const canIssueHq = data.tier === 'ultimate' || hqRem === null || hqRem > 0 || tk > 0;
            setCertificateType(canIssueHq ? 'high_quality' : 'card');
          }
        }
      } catch (err) {
        console.error('Failed to fetch certificate status:', err);
      } finally {
        setIsLoadingQuota(false);
      }
    },
    [island, user, initialCertificateType]
  );

  // Sync displayed serial number with activeIssuedCert
  useEffect(() => {
    if (activeIssuedCert && typeof activeIssuedCert.serial_number === 'number') {
      setAssignedSerial(`No.${String(activeIssuedCert.serial_number).padStart(4, '0')}`);
    } else {
      setAssignedSerial('No.----');
    }
  }, [activeIssuedCert]);

  // Initialize modal fields per island
  useEffect(() => {
    if (!isOpen || !island) {
      initializedIslandKeyRef.current = '';
      setIsPlayingAd(false);
      setJustIssuedCert(null);
      setShowSaveGuidePanel(false);
      setLimitErrorMessage(null);
      return;
    }

    const initKey = `${island.id}_${user?.id || 'guest'}`;
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
        `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(
          today.getDate()
        ).padStart(2, '0')}`;
      setVisitDate(dateStr);
      setCustomImage(tempCheckInPhotoUrl || storedPhoto || null);
      setTravelerName(contextTravelerName || user?.email?.split('@')[0] || '島旅トラベラー');
      setIsOrdering(false);
      setOrderSuccess(false);
      setErrorMessage(null);
      setUploadError(null);
      setLimitErrorMessage(null);
      setJustIssuedCert(null);
      setShowSaveGuidePanel(false);
      setActiveSponsor(null);
      setBundleIsland2('');
      setBundleIsland3('');
      if (!user) {
        setCertificateType('card');
        setAssignedSerial('No.----');
      } else {
        void refreshServerCertificateState(true);
      }
    } else if (tempCheckInPhotoUrl) {
      setCustomImage(tempCheckInPhotoUrl);
      if (tempCheckInDate) setVisitDate(tempCheckInDate);
    }
  }, [
    isOpen,
    island,
    user,
    contextTravelerName,
    tempCheckInDate,
    tempCheckInPhotoUrl,
    refreshServerCertificateState,
  ]);

  // Ad timer countdown (for Free users during official issuance)
  useEffect(() => {
    if (isPlayingAd && adTimeLeft > 0) {
      const timer = setTimeout(() => {
        setAdTimeLeft((prev) => Math.max(0, prev - 1));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isPlayingAd, adTimeLeft]);

  const handleSponsorClick = useCallback(
    (sponsor: ActiveSponsorInfo, placement = 'certificate_5s_cm') => {
      try {
        void fetch('/api/tracking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event_type: 'partner_cm_click',
            target_id: sponsor.id,
            island_id: String(island?.id || ''),
            metadata: {
              partner_name: sponsor.name,
              sponsor_tier: sponsor.sponsor_tier,
              placement,
            },
          }),
        }).catch(() => {});
      } catch {
        // Best-effort analytics
      }
    },
    [island?.id]
  );

  const handleBuyTicketPack = useCallback(
    async (pack: 'pack_3' | 'pack_10') => {
      if (!user) {
        setIsAuthModalOpen(true);
        return;
      }
      setBuyingTicketPack(pack);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const token = session?.access_token || '';
        if (!token) {
          toast.error('ログインセッションの確認に失敗しました。再度ログインしてください。');
          return;
        }
        const res = await fetch('/api/tickets/checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            pack,
            cancelPath: typeof window !== 'undefined' ? window.location.pathname : '/mypage',
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.url) {
          window.location.href = data.url;
        } else {
          toast.error(data.error || 'チケット決済ページの準備に失敗しました。');
        }
      } catch (err) {
        console.error('Ticket pack checkout error:', err);
        toast.error('通信エラーが発生しました。');
      } finally {
        setBuyingTicketPack(null);
      }
    },
    [user]
  );

  const handleOrderSubmit = async () => {
    if (!hasVisitedIsland) {
      setErrorMessage('未訪問の島の公式紙証明書はオーダーできません。');
      return;
    }
    if (!recipientName.trim() || !address.trim() || !postalCode.trim() || !phoneNumber.trim()) {
      setErrorMessage('すべての必須項目（お名前、郵便番号、ご住所、電話番号）を入力してください。');
      return;
    }
    setErrorMessage(null);
    setOrderSubmitting(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token || '';
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const bundleIslandNames =
        orderPlan === 'bundle_3'
          ? [bundleIsland2.trim(), bundleIsland3.trim()].filter(Boolean)
          : undefined;

      const res = await fetch('/api/order/checkout', {
        method: 'POST',
        headers,
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
          userId: user?.id,
          ...(bundleIslandNames && bundleIslandNames.length > 0 ? { bundleIslandNames } : {}),
        }),
      });
      const rawCheckoutText = await res.text();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let data: any = {};
      try {
        data = rawCheckoutText ? JSON.parse(rawCheckoutText) : {};
      } catch {
        data = {};
      }
      if (res.ok && data.url) {
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
        const rawZip = await res.text();
        const data = rawZip ? JSON.parse(rawZip) : {};
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

  // Sync pre-built PNG Blob + File cache from canvasRef so mobile Share / Download runs with ZERO await
  const cacheLatestCanvasArtifacts = useCallback(
    async (effectiveType: 'card' | 'high_quality', effectiveSerial: string) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      try {
        const blob = await new Promise<Blob | null>((resolve) => {
          try {
            canvas.toBlob((b) => resolve(b), 'image/png', 1.0);
          } catch {
            resolve(null);
          }
        });
        if (blob) {
          latestPngBlobRef.current = blob;
          const fileName = buildCertificateFilename(island?.name, visitDate, effectiveType, effectiveSerial);
          latestPngFileRef.current = new File([blob], fileName, { type: 'image/png' });
        }
        try {
          const previewUrl = canvas.toDataURL('image/png');
          setLatestPreviewDataUrl(previewUrl);
        } catch {
          // Ignore preview dataUrl errors
        }
      } catch {
        // Ignore export cache errors
      }
    },
    [island?.name, visitDate]
  );

  // Draw Certificate to Canvas (supports explicit overrides to prevent stale React state during issuance)
  const drawCertificate = useCallback(
    (overrides?: {
      type?: 'card' | 'high_quality';
      serial?: string;
      forceCleanWatermark?: boolean;
    }): Promise<void> => {
      const targetType = overrides?.type || certificateType;
      const targetSerial = overrides?.serial || assignedSerial || 'No.----';

      let watermarkLabel: string | null = null;
      if (!overrides?.forceCleanWatermark) {
        const issuedForTarget =
          targetType === 'high_quality' ? issuedCertMap.high_quality : issuedCertMap.card;
        if (!hasVisitedIsland) {
          watermarkLabel = 'SAMPLE / 見本（未到達）';
        } else if (!user) {
          watermarkLabel = 'SAMPLE / 無料ログイン後に発行可能';
        } else if (!issuedForTarget) {
          if (targetType === 'high_quality' && isHighQualityQuotaExhausted) {
            watermarkLabel = 'SAMPLE / 今月の高画質枠上限';
          } else if (targetType === 'card' && isCardDailyQuotaExhausted) {
            watermarkLabel = 'SAMPLE / 本日の新規発行上限';
          }
        }
      }

      const drawToCanvas = async (canvas: HTMLCanvasElement | null, seq: number): Promise<void> => {
        if (!canvas || !island) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const isVert = orientation === 'vertical';
        const width = isVert ? 1080 : 1414;
        const height = isVert ? 1920 : 1000;
        const scaleRatio = targetType === 'card' ? (isVert ? 0.65 : 0.7) : 1.0;

        const fillFittedText = (
          c: CanvasRenderingContext2D,
          text: string,
          x: number,
          y: number,
          maxWidth: number,
          basePx: number,
          minPx: number,
          fontWeightAndFamily: string
        ) => {
          let px = basePx;
          c.font = `${px}px ${fontWeightAndFamily}`.replace(/^(\d+px)\s+(bold|900|800)\s+/, '$2 $1 ');
          while (px > minPx && c.measureText(text).width > maxWidth) {
            px -= 2;
            c.font = `${px}px ${fontWeightAndFamily}`.replace(/^(\d+px)\s+(bold|900|800)\s+/, '$2 $1 ');
          }
          c.fillText(text, x, y, maxWidth);
        };

        const regionObj = regionsData.find((r) => r.id === island.region_id);
        const regionLabel = regionObj?.name || island.prefecture || '日本離島';
        const prefPrefix =
          island.prefecture && !island.name?.startsWith(island.prefecture)
            ? `${island.prefecture} `
            : '';

        const drawProtectiveWatermark = (c: CanvasRenderingContext2D, label: string) => {
          c.save();
          c.translate(width / 2, height / 2);
          c.rotate(-Math.PI / 7);
          c.textAlign = 'center';
          c.textBaseline = 'middle';

          // Repeat subtle diagonal bands + central bold stamp
          c.font = 'bold 34px sans-serif';
          c.fillStyle = 'rgba(255, 255, 255, 0.14)';
          for (let dy = -height; dy <= height; dy += 240) {
            c.fillText(`${label}   •   KIRATABI PREVIEW`, 0, dy);
          }

          const bannerW = Math.min(width * 0.92, 980);
          const bannerH = 128;
          c.fillStyle = 'rgba(15, 23, 42, 0.78)';
          c.fillRect(-bannerW / 2, -bannerH / 2, bannerW, bannerH);
          c.strokeStyle = 'rgba(245, 158, 11, 0.85)';
          c.lineWidth = 4;
          c.strokeRect(-bannerW / 2, -bannerH / 2, bannerW, bannerH);

          c.fillStyle = '#FBBF24';
          fillFittedText(c, label, 0, 4, bannerW - 48, 52, 28, 'bold sans-serif');
          c.restore();
        };

        const renderContent = (c: CanvasRenderingContext2D, heroImg?: HTMLImageElement) => {
          canvas.width = Math.round(width * scaleRatio);
          canvas.height = Math.round(height * scaleRatio);
          c.save();
          c.scale(scaleRatio, scaleRatio);

          if (anniversaryMode) {
            c.fillStyle = '#0A0F2E';
            c.fillRect(0, 0, width, height);
            c.strokeStyle = '#C9A84C';
            c.lineWidth = 14;
            c.strokeRect(25, 25, width - 50, height - 50);
            c.fillStyle = '#E8D5A3';
            c.font = 'bold 40px serif';
            c.textAlign = 'center';
            c.fillText('★★★ 1ST ANNIVERSARY ★★★', width / 2, height / 2);
            c.restore();
            return;
          }

          if (designTheme === 'modern') {
            const grad = c.createLinearGradient(0, 0, width, height);
            grad.addColorStop(0, '#0F172A');
            grad.addColorStop(1, '#1E3A8A');
            c.fillStyle = grad;
            c.fillRect(0, 0, width, height);
            c.strokeStyle = '#94A3B8';
            c.lineWidth = 8;
            c.strokeRect(30, 30, width - 60, height - 60);
            c.strokeStyle = '#38BDF8';
            c.lineWidth = 2;
            c.strokeRect(42, 42, width - 84, height - 84);
          } else if (designTheme === 'vintage') {
            c.fillStyle = '#FCE3B6';
            c.fillRect(0, 0, width, height);
            c.strokeStyle = '#8B4513';
            c.lineWidth = 10;
            c.strokeRect(30, 30, width - 60, height - 60);
            c.strokeStyle = '#A0522D';
            c.lineWidth = 2;
            c.strokeRect(46, 46, width - 92, height - 92);
          } else {
            const grad = c.createRadialGradient(
              width / 2,
              height / 2,
              100,
              width / 2,
              height / 2,
              Math.max(width, height)
            );
            grad.addColorStop(0, '#1E293B');
            grad.addColorStop(0.7, '#0F172A');
            grad.addColorStop(1, '#090D16');
            c.fillStyle = grad;
            c.fillRect(0, 0, width, height);

            c.save();
            c.translate(width / 2, height / 2);
            c.strokeStyle = 'rgba(212, 175, 55, 0.07)';
            c.fillStyle = 'rgba(212, 175, 55, 0.04)';
            c.lineWidth = 2;
            const r = Math.min(width, height) * 0.35;
            c.beginPath();
            c.arc(0, 0, r, 0, Math.PI * 2);
            c.stroke();
            c.beginPath();
            c.arc(0, 0, r * 0.85, 0, Math.PI * 2);
            c.stroke();
            for (let i = 0; i < 8; i++) {
              const angle = (i * Math.PI) / 4;
              const len = i % 2 === 0 ? r * 1.12 : r * 0.82;
              const hw = i % 2 === 0 ? 14 : 7;
              c.save();
              c.rotate(angle);
              c.beginPath();
              c.moveTo(0, -len);
              c.lineTo(hw, 0);
              c.lineTo(0, 0);
              c.closePath();
              c.fill();
              c.stroke();
              c.restore();
            }
            c.restore();

            c.fillStyle = 'rgba(243, 229, 171, 0.12)';
            for (let i = 0; i < 65; i++) {
              const px = Math.sin(i * 17) * width * 0.45 + width / 2;
              const py = Math.cos(i * 23) * height * 0.45 + height / 2;
              const psize = (i % 3) + 1;
              c.beginPath();
              c.arc(px, py, psize, 0, Math.PI * 2);
              c.fill();
            }

            c.strokeStyle = '#D4AF37';
            c.lineWidth = 14;
            c.strokeRect(24, 24, width - 48, height - 48);

            c.strokeStyle = '#F59E0B';
            c.lineWidth = 2;
            c.strokeRect(36, 36, width - 72, height - 72);

            c.strokeStyle = '#F3E5AB';
            c.lineWidth = 3;
            c.strokeRect(44, 44, width - 88, height - 88);

            c.strokeStyle = 'rgba(212, 175, 55, 0.5)';
            c.lineWidth = 1;
            c.strokeRect(52, 52, width - 104, height - 104);

            const cornerFiligree = (cxCorner: number, cyCorner: number, rot: number) => {
              c.save();
              c.translate(cxCorner, cyCorner);
              c.rotate(rot);
              c.strokeStyle = '#D4AF37';
              c.fillStyle = '#F3E5AB';
              c.lineWidth = 2.5;
              c.beginPath();
              c.arc(0, 0, 45, 0, Math.PI / 2);
              c.stroke();
              c.beginPath();
              c.arc(0, 0, 52, 0, Math.PI / 2);
              c.stroke();
              c.beginPath();
              c.arc(28, 28, 12, 0, Math.PI * 2);
              c.stroke();
              c.beginPath();
              c.arc(16, 0, 4, 0, Math.PI * 2);
              c.fill();
              c.beginPath();
              c.arc(0, 16, 4, 0, Math.PI * 2);
              c.fill();
              c.restore();
            };

            cornerFiligree(52, 52, 0);
            cornerFiligree(width - 52, 52, Math.PI / 2);
            cornerFiligree(width - 52, height - 52, Math.PI);
            cornerFiligree(52, height - 52, (Math.PI * 3) / 2);
          }

          if (hasHologram && targetType === 'high_quality') {
            const holoGrad = c.createLinearGradient(0, 0, width, height);
            holoGrad.addColorStop(0, 'rgba(236, 72, 153, 0.15)');
            holoGrad.addColorStop(0.5, 'rgba(14, 165, 233, 0.15)');
            holoGrad.addColorStop(1, 'rgba(16, 185, 129, 0.15)');
            c.fillStyle = holoGrad;
            c.fillRect(0, 0, width, height);
          }

          let primaryColor: string, secondaryColor: string, accentColor: string;
          if (designTheme === 'modern') {
            primaryColor = '#F8FAFC';
            secondaryColor = '#94A3B8';
            accentColor = '#38BDF8';
          } else if (designTheme === 'vintage') {
            primaryColor = '#3E2723';
            secondaryColor = '#5D4037';
            accentColor = '#D84315';
          } else {
            primaryColor = '#F3E5AB';
            secondaryColor = '#94A3B8';
            accentColor = '#D4AF37';
          }

          const cx = width / 2;
          const displaySerial = targetSerial;
          const diff = getIslandDifficulty(island);

          if (isVert) {
            c.textAlign = 'center';
            c.textBaseline = 'alphabetic';

            c.fillStyle = secondaryColor;
            c.font = 'bold 24px serif';
            c.fillText(
              hasHologram
                ? 'KIRATABI VERIFIED PHOTO ARRIVAL RECORD'
                : 'KIRATABI OFFICIAL RECORD OF ARRIVAL',
              cx,
              140
            );

            c.fillStyle = accentColor;
            c.font = 'bold 62px "Hiragino Mincho ProN", "Yu Mincho", "Noto Serif JP", serif';
            c.fillText(targetType === 'card' ? '公 認 到 達 証' : '島 旅 到 達 公 認 証', cx, 224);

            c.strokeStyle = 'rgba(212, 175, 55, 0.45)';
            c.lineWidth = 2;
            c.beginPath();
            c.moveTo(cx - 260, 254);
            c.lineTo(cx + 260, 254);
            c.stroke();

            const nameBoxTop = 285;
            const nameBoxH = 82;
            const nameBoxW = 760;
            const bannerGrad = c.createLinearGradient(cx - nameBoxW / 2, 0, cx + nameBoxW / 2, 0);
            bannerGrad.addColorStop(0, 'rgba(212, 175, 55, 0.05)');
            bannerGrad.addColorStop(0.5, 'rgba(212, 175, 55, 0.25)');
            bannerGrad.addColorStop(1, 'rgba(212, 175, 55, 0.05)');
            c.fillStyle = bannerGrad;
            c.fillRect(cx - nameBoxW / 2, nameBoxTop, nameBoxW, nameBoxH);

            c.strokeStyle = '#D4AF37';
            c.lineWidth = 2;
            c.strokeRect(cx - nameBoxW / 2, nameBoxTop, nameBoxW, nameBoxH);
            c.strokeStyle = '#F59E0B';
            c.lineWidth = 1;
            c.strokeRect(cx - nameBoxW / 2 + 6, nameBoxTop + 6, nameBoxW - 12, nameBoxH - 12);

            c.fillStyle = primaryColor;
            fillFittedText(
              c,
              `${travelerName || '島旅トラベラー'}  殿`,
              cx,
              nameBoxTop + 57,
              nameBoxW - 48,
              48,
              28,
              'bold "Hiragino Mincho ProN", "Yu Mincho", "Noto Serif JP", serif'
            );

            c.fillStyle = secondaryColor;
            c.font = 'bold 21px "Hiragino Mincho ProN", "Yu Mincho", "Noto Serif JP", serif';
            c.fillText(
              '貴殿が下記離島へ実際に渡航・到達したことを公式に認定しこれを証します',
              cx,
              412,
              880
            );

            c.fillStyle = accentColor;
            fillFittedText(
              c,
              `【 到達離島 】 ${prefPrefix}${island.name}（${regionLabel}）`,
              cx,
              474,
              900,
              34,
              22,
              'bold "Hiragino Mincho ProN", "Yu Mincho", sans-serif'
            );

            c.fillStyle =
              designTheme === 'modern'
                ? '#38BDF8'
                : designTheme === 'vintage'
                ? '#8D3B12'
                : '#F59E0B';
            fillFittedText(
              c,
              `【 冒険難易度 】 ${diff.stars} (${diff.shortLabel})   ｜   【 到達日 】 ${visitDate}`,
              cx,
              528,
              900,
              25,
              18,
              'bold sans-serif'
            );

            if (heroImg) {
              c.save();
              const isPortraitPhoto = heroImg.height > heroImg.width;
              const heroW = isPortraitPhoto ? 700 : 860;
              const heroH = isPortraitPhoto ? 910 : 580;
              const heroX = cx - heroW / 2;
              const heroY = isPortraitPhoto ? 585 : 735;

              c.beginPath();
              c.rect(heroX, heroY, heroW, heroH);
              c.clip();

              const scale = Math.max(heroW / heroImg.width, heroH / heroImg.height);
              const dw = heroImg.width * scale;
              const dh = heroImg.height * scale;
              c.drawImage(heroImg, heroX + (heroW - dw) / 2, heroY + (heroH - dh) / 2, dw, dh);
              c.restore();

              c.strokeStyle = accentColor;
              c.lineWidth = 6;
              c.strokeRect(heroX, heroY, heroW, heroH);
              c.strokeStyle = '#F59E0B';
              c.lineWidth = 2;
              c.strokeRect(heroX - 7, heroY - 7, heroW + 14, heroH + 14);

              const drawCornerBracket = (bx: number, by: number, rot: number) => {
                c.save();
                c.translate(bx, by);
                c.rotate(rot);
                c.strokeStyle = '#F3E5AB';
                c.lineWidth = 3;
                c.beginPath();
                c.moveTo(-16, 0);
                c.lineTo(0, 0);
                c.lineTo(0, -16);
                c.stroke();
                c.restore();
              };
              drawCornerBracket(heroX - 7, heroY - 7, 0);
              drawCornerBracket(heroX + heroW + 7, heroY - 7, Math.PI / 2);
              drawCornerBracket(heroX + heroW + 7, heroY + heroH + 7, Math.PI);
              drawCornerBracket(heroX - 7, heroY + heroH + 7, (Math.PI * 3) / 2);
            } else {
              const plateW = 840;
              const plateH = 540;
              const plateX = cx - plateW / 2;
              const plateY = 755;
              c.fillStyle =
                designTheme === 'vintage' ? 'rgba(93, 64, 55, 0.08)' : 'rgba(15, 23, 42, 0.55)';
              c.fillRect(plateX, plateY, plateW, plateH);
              c.strokeStyle = accentColor;
              c.lineWidth = 4;
              c.strokeRect(plateX, plateY, plateW, plateH);
              c.strokeStyle = 'rgba(212, 175, 55, 0.4)';
              c.lineWidth = 1.5;
              c.strokeRect(plateX + 12, plateY + 12, plateW - 24, plateH - 24);

              c.textAlign = 'center';
              c.fillStyle = accentColor;
              c.font = 'bold 26px serif';
              c.fillText('OFFICIAL MARITIME EXPEDITION RECORD', cx, plateY + 145);
              c.fillStyle = primaryColor;
              fillFittedText(c, island.name, cx, plateY + 250, plateW - 60, 54, 30, 'bold serif');
              c.fillStyle = secondaryColor;
              c.font = '24px monospace';
              c.fillText(
                `COORDINATES: ${island.coordinates || 'JAPAN ARCHIPELAGO'}`,
                cx,
                plateY + 340,
                plateW - 60
              );
              c.fillText(`REGION: ${prefPrefix}${regionLabel}`, cx, plateY + 395, plateW - 60);
            }

            c.strokeStyle = 'rgba(212, 175, 55, 0.35)';
            c.lineWidth = 1.5;
            c.beginPath();
            c.moveTo(100, 1570);
            c.lineTo(width - 100, 1570);
            c.stroke();

            drawOfficialMedallionSeal(c, 185, 1715, 72, {
              variant: designTheme === 'vintage' ? 'crimson' : 'gold',
            });

            c.textAlign = 'center';
            c.textBaseline = 'alphabetic';
            c.fillStyle = secondaryColor;
            c.font = 'bold 20px monospace';
            c.fillText(`SERIAL NO: ${displaySerial}`, cx, 1650, 440);
            c.font = '18px monospace';
            c.fillText(`LAT/LON: ${island.coordinates || 'JAPAN ARCHIPELAGO'}`, cx, 1684, 440);

            c.fillStyle = primaryColor;
            c.font = 'bold 31px "Hiragino Mincho ProN", "Yu Mincho", "Noto Serif JP", serif';
            c.fillText('輝旅 島専科', cx, 1742, 440);
            c.fillStyle = accentColor;
            c.font = 'bold 20px "Hiragino Mincho ProN", "Yu Mincho", "Noto Serif JP", serif';
            c.fillText('離島到達公式認定委員会 発行', cx, 1780, 440);
            c.fillStyle = secondaryColor;
            c.font = '15px sans-serif';
            c.fillText('KIRATABI SHIMASENKA OFFICIAL CERTIFICATION BOARD', cx, 1812, 440);

            drawOfficialSquareHanko(c, 895, 1715, 138, {
              onDarkBackground: designTheme !== 'vintage',
            });
          } else {
            c.textAlign = 'center';
            c.textBaseline = 'alphabetic';

            c.fillStyle = secondaryColor;
            c.font = 'bold 20px serif';
            c.fillText(
              hasHologram
                ? 'KIRATABI VERIFIED PHOTO ARRIVAL RECORD'
                : 'KIRATABI OFFICIAL RECORD OF ARRIVAL',
              cx,
              102
            );

            c.fillStyle = accentColor;
            c.font = 'bold 50px "Hiragino Mincho ProN", "Yu Mincho", "Noto Serif JP", serif';
            c.fillText(targetType === 'card' ? '公 認 到 達 証' : '島 旅 到 達 公 認 証', cx, 166);

            c.strokeStyle = 'rgba(212, 175, 55, 0.45)';
            c.lineWidth = 1.8;
            c.beginPath();
            c.moveTo(cx - 250, 190);
            c.lineTo(cx + 250, 190);
            c.stroke();

            const nameBoxTop = 212;
            const nameBoxH = 66;
            const nameBoxW = 640;
            const bannerGrad = c.createLinearGradient(cx - nameBoxW / 2, 0, cx + nameBoxW / 2, 0);
            bannerGrad.addColorStop(0, 'rgba(212, 175, 55, 0.05)');
            bannerGrad.addColorStop(0.5, 'rgba(212, 175, 55, 0.25)');
            bannerGrad.addColorStop(1, 'rgba(212, 175, 55, 0.05)');
            c.fillStyle = bannerGrad;
            c.fillRect(cx - nameBoxW / 2, nameBoxTop, nameBoxW, nameBoxH);

            c.strokeStyle = '#D4AF37';
            c.lineWidth = 2;
            c.strokeRect(cx - nameBoxW / 2, nameBoxTop, nameBoxW, nameBoxH);
            c.strokeStyle = '#F59E0B';
            c.lineWidth = 1;
            c.strokeRect(cx - nameBoxW / 2 + 5, nameBoxTop + 5, nameBoxW - 10, nameBoxH - 10);

            c.fillStyle = primaryColor;
            fillFittedText(
              c,
              `${travelerName || '島旅トラベラー'}  殿`,
              cx,
              nameBoxTop + 47,
              nameBoxW - 40,
              40,
              24,
              'bold "Hiragino Mincho ProN", "Yu Mincho", "Noto Serif JP", serif'
            );

            c.fillStyle = secondaryColor;
            c.font = 'bold 17px "Hiragino Mincho ProN", "Yu Mincho", "Noto Serif JP", serif';
            c.fillText(
              '貴殿が下記離島へ実際に渡航・到達したことを公式に認定しこれを証します',
              cx,
              312,
              1100
            );

            c.fillStyle = accentColor;
            fillFittedText(
              c,
              `【 到達離島 】 ${prefPrefix}${island.name}（${regionLabel}）`,
              cx,
              360,
              1160,
              28,
              20,
              'bold "Hiragino Mincho ProN", "Yu Mincho", sans-serif'
            );

            c.fillStyle =
              designTheme === 'modern'
                ? '#38BDF8'
                : designTheme === 'vintage'
                ? '#8D3B12'
                : '#F59E0B';
            fillFittedText(
              c,
              `【 冒険難易度 】 ${diff.stars} (${diff.shortLabel})   ｜   【 到達日 】 ${visitDate}`,
              cx,
              402,
              1160,
              21,
              16,
              'bold sans-serif'
            );

            if (heroImg) {
              c.save();
              const isPortraitPhoto = heroImg.height > heroImg.width;
              const heroW = isPortraitPhoto ? 286 : 580;
              const heroH = 342;
              const heroX = cx - heroW / 2;
              const heroY = 436;

              c.beginPath();
              c.rect(heroX, heroY, heroW, heroH);
              c.clip();

              const scale = Math.max(heroW / heroImg.width, heroH / heroImg.height);
              const dw = heroImg.width * scale;
              const dh = heroImg.height * scale;
              c.drawImage(heroImg, heroX + (heroW - dw) / 2, heroY + (heroH - dh) / 2, dw, dh);
              c.restore();

              c.strokeStyle = accentColor;
              c.lineWidth = 5;
              c.strokeRect(heroX, heroY, heroW, heroH);
              c.strokeStyle = '#F59E0B';
              c.lineWidth = 1.8;
              c.strokeRect(heroX - 6, heroY - 6, heroW + 12, heroH + 12);
            } else {
              const plateW = 620;
              const plateH = 324;
              const plateX = cx - plateW / 2;
              const plateY = 444;
              c.fillStyle =
                designTheme === 'vintage' ? 'rgba(93, 64, 55, 0.08)' : 'rgba(15, 23, 42, 0.55)';
              c.fillRect(plateX, plateY, plateW, plateH);
              c.strokeStyle = accentColor;
              c.lineWidth = 3.5;
              c.strokeRect(plateX, plateY, plateW, plateH);
              c.strokeStyle = 'rgba(212, 175, 55, 0.4)';
              c.lineWidth = 1.5;
              c.strokeRect(plateX + 10, plateY + 10, plateW - 20, plateH - 20);

              c.textAlign = 'center';
              c.fillStyle = accentColor;
              c.font = 'bold 18px serif';
              c.fillText('OFFICIAL MARITIME EXPEDITION RECORD', cx, plateY + 78);
              c.fillStyle = primaryColor;
              fillFittedText(
                c,
                `${prefPrefix}${island.name}`,
                cx,
                plateY + 156,
                plateW - 48,
                38,
                24,
                'bold serif'
              );
              c.fillStyle = secondaryColor;
              c.font = '18px monospace';
              c.fillText(
                `COORDINATES: ${island.coordinates || 'JAPAN ARCHIPELAGO'}`,
                cx,
                plateY + 220,
                plateW - 48
              );
              c.fillText('KIRATABI VERIFIED ARCHIPELAGO ARCHIVE', cx, plateY + 256, plateW - 48);
            }

            c.strokeStyle = 'rgba(212, 175, 55, 0.35)';
            c.lineWidth = 1.5;
            c.beginPath();
            c.moveTo(96, 806);
            c.lineTo(width - 96, 806);
            c.stroke();

            drawOfficialMedallionSeal(c, 162, 872, 54, {
              variant: designTheme === 'vintage' ? 'crimson' : 'gold',
            });

            c.textAlign = 'left';
            c.textBaseline = 'alphabetic';
            c.fillStyle = secondaryColor;
            c.font = 'bold 17px monospace';
            c.fillText(`SERIAL: ${displaySerial}`, 236, 864, 260);
            c.font = '15px monospace';
            c.fillText(`GPS: ${island.coordinates || 'JAPAN'}`, 236, 892, 260);

            c.textAlign = 'center';
            c.fillStyle = primaryColor;
            c.font = 'bold 24px "Hiragino Mincho ProN", "Yu Mincho", "Noto Serif JP", serif';
            c.fillText('輝旅 島専科（KIRATABI SHIMASENKA）', cx, 858, 420);
            c.fillStyle = accentColor;
            c.font = 'bold 17px "Hiragino Mincho ProN", "Yu Mincho", "Noto Serif JP", serif';
            c.fillText('離島到達公式認定委員会 発行', cx, 888, 420);
            c.fillStyle = secondaryColor;
            c.font = '13px sans-serif';
            c.fillText('OFFICIAL ISLAND CONQUEST CERTIFICATION BOARD', cx, 914, 420);

            drawOfficialSquareHanko(c, 1246, 870, 110, {
              onDarkBackground: designTheme !== 'vintage',
            });
          }

          if (watermarkLabel) {
            drawProtectiveWatermark(c, watermarkLabel);
          }

          c.restore();
        };

        const verifiedPhotos = getVerifiedIslandPhotos(island);
        const verifiedFallbackUrl =
          orientation === 'vertical'
            ? verifiedPhotos.mobileUrl || verifiedPhotos.desktopUrl
            : verifiedPhotos.desktopUrl || verifiedPhotos.mobileUrl;
        const activePhotoSrc = customImage || tempCheckInPhotoUrl || verifiedFallbackUrl || '';

        const heroImg = activePhotoSrc ? await loadCorsSafeImage(activePhotoSrc) : undefined;
        if (seq === renderSeqRef.current) {
          renderContent(ctx, heroImg);
        }
      };

      const seq = ++renderSeqRef.current;
      const tasks = [drawToCanvas(canvasRef.current, seq)];
      if (isFullscreenPreview) {
        tasks.push(drawToCanvas(fullscreenCanvasRef.current, seq));
      }
      return Promise.all(tasks).then(async () => {
        if (!watermarkLabel && seq === renderSeqRef.current) {
          await cacheLatestCanvasArtifacts(targetType, targetSerial);
        } else {
          latestPngBlobRef.current = null;
          latestPngFileRef.current = null;
          setLatestPreviewDataUrl(null);
        }
      });
    },
    [
      island,
      anniversaryMode,
      travelerName,
      visitDate,
      hasHologram,
      customImage,
      tempCheckInPhotoUrl,
      certificateType,
      orientation,
      designTheme,
      isFullscreenPreview,
      assignedSerial,
      hasVisitedIsland,
      user,
      issuedCertMap,
      isHighQualityQuotaExhausted,
      isCardDailyQuotaExhausted,
      cacheLatestCanvasArtifacts,
    ]
  );

  useEffect(() => {
    if (isFullscreenPreview) {
      const timer = setTimeout(() => {
        void drawCertificate();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isFullscreenPreview, drawCertificate]);

  useEffect(() => {
    if (!isOpen || !island) return;
    const timer = setTimeout(() => {
      void drawCertificate();
    }, 60);
    return () => clearTimeout(timer);
  }, [isOpen, island, drawCertificate]);

  // Synchronous File Download helper (uses server attachment proxy if cloud URL exists, else synchronous Blob/DataURL)
  const triggerSynchronousFileDownload = useCallback(
    (cloudImageUrl?: string | null, overrideType?: 'card' | 'high_quality', overrideSerial?: string) => {
      const targetType = overrideType || certificateType;
      const targetSerial = overrideSerial || assignedSerial;
      const fileName = buildCertificateFilename(island?.name, visitDate, targetType, targetSerial);

      // Priority 1: Local lossless PNG Blob from Canvas (always includes latest text/photo edits!)
      if (latestPngBlobRef.current) {
        const blobUrl = URL.createObjectURL(latestPngBlobRef.current);
        const link = document.createElement('a');
        link.download = fileName;
        link.href = blobUrl;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          if (document.body.contains(link)) document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);
        }, 15000);
        setShowSaveGuidePanel(true);
        toast.success('📥 証明書のダウンロードを開始しました！');
        return;
      }

      // Priority 2: Server Content-Disposition: attachment proxy for cloud URL
      if (cloudImageUrl && cloudImageUrl.startsWith('https://')) {
        const proxyHref = `/api/certificates/download?url=${encodeURIComponent(
          cloudImageUrl
        )}&name=${encodeURIComponent(fileName)}`;
        const link = document.createElement('a');
        link.href = proxyHref;
        link.download = fileName;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          if (document.body.contains(link)) document.body.removeChild(link);
        }, 5000);
        setShowSaveGuidePanel(true);
        toast.success('📥 証明書のダウンロードを開始しました！');
        return;
      }

      toast.error('証明書画像の準備中です。もう一度ボタンを押してください。');
    },
    [certificateType, assignedSerial, island?.name, visitDate]
  );

  // Synchronous iOS/Android Camera Roll Share Sheet ("画像を保存")
  const triggerMobilePhotoShare = useCallback(async () => {
    const file = latestPngFileRef.current;
    if (file && typeof navigator !== 'undefined' && navigator.share && navigator.canShare) {
      try {
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `【キラ旅】${island?.name} 到達証明書`,
          });
          return;
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return;
      }
    }
    // Fallback if browser doesn't support file sharing (e.g. desktop or LINE in-app browser)
    setShowSaveGuidePanel(true);
    triggerSynchronousFileDownload(activeIssuedCert?.image_url);
  }, [island?.name, activeIssuedCert?.image_url, triggerSynchronousFileDownload]);

  // Build size-safe DataURL for server storage (< 3.2MB base64 so Vercel 4.5MB limit is never exceeded)
  const buildCloudUploadDataUrl = (): string | undefined => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    try {
      const pngDataUrl = canvas.toDataURL('image/png');
      if (pngDataUrl.length <= 3_200_000) {
        return pngDataUrl;
      }
      return canvas.toDataURL('image/jpeg', 0.94);
    } catch {
      return undefined;
    }
  };

  // Official Server Issuance / Re-save Flow (strictly enforces quota BEFORE unlocking download!)
  const executeOfficialIssuance = useCallback(
    async (targetType: 'card' | 'high_quality', isDesignUpdate = false) => {
      if (!island || !user) {
        setIsAuthModalOpen(true);
        return;
      }
      if (!hasVisitedIsland) {
        toast.error('未訪問の島の公式証明書は発行できません。');
        return;
      }

      setLimitErrorMessage(null);
      setErrorMessage(null);
      setCertificateType(targetType);
      setIsIssuingServer(true);

      const existingForType =
        targetType === 'high_quality' ? issuedCertMap.high_quality : issuedCertMap.card;

      // Play 5s Sponsor PR ONLY on initial new issuance for Free tier (never on re-downloads or design updates!)
      const shouldShowSponsorPr = !isPremium && !existingForType && !isDesignUpdate;
      if (shouldShowSponsorPr) {
        setJustIssuedCert(null);
        setIsPlayingAd(true);
        setAdTimeLeft(5);
      }

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const token = session?.access_token || '';
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        // Step 1: Reserve / verify official serial number & quota on server
        let officialSerialStr = existingForType
          ? `No.${String(existingForType.serial_number).padStart(4, '0')}`
          : '';
        let issuedRecord: ServerCertificateRecord | null = existingForType || null;

        if (!existingForType) {
          const reserveRes = await fetch('/api/certificates', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              islandId: String(island.id),
              userId: user.id,
              type: targetType,
            }),
          });
          const rawReserve = await reserveRes.text();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let reserveData: any = {};
          try {
            reserveData = rawReserve ? JSON.parse(rawReserve) : {};
          } catch {
            reserveData = {};
          }

          if (reserveData.tier) setServerTier(reserveData.tier);
          if (typeof reserveData.tickets === 'number') setServerTickets(reserveData.tickets);
          if (reserveData.quota) setServerQuota(reserveData.quota);

          if (!reserveRes.ok) {
            setIsPlayingAd(false);
            const msg =
              reserveData.message ||
              reserveData.error ||
              '発行枠の上限に達したため発行できませんでした。';
            setLimitErrorMessage(msg);
            toast.error(msg);
            return;
          }

          issuedRecord = reserveData.certificate as ServerCertificateRecord;
          officialSerialStr = `No.${String(issuedRecord.serial_number).padStart(4, '0')}`;
          setAssignedSerial(officialSerialStr);
        }

        // Step 2: Render clean official certificate onto <canvas> with TRUE DB serial number
        await drawCertificate({
          type: targetType,
          serial: officialSerialStr,
          forceCleanWatermark: true,
        });

        // Step 3: Upload rendered certificate image to Supabase Storage via server (re-issue path = 0 quota consumed!)
        const imageDataUrl = buildCloudUploadDataUrl();
        if (imageDataUrl) {
          const uploadRes = await fetch('/api/certificates', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              islandId: String(island.id),
              userId: user.id,
              type: targetType,
              imageDataUrl,
            }),
          });
          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            if (uploadData.certificate) {
              issuedRecord = uploadData.certificate as ServerCertificateRecord;
            }
            if (uploadData.quota) setServerQuota(uploadData.quota);
            if (typeof uploadData.tickets === 'number') setServerTickets(uploadData.tickets);
          }
        }

        if (issuedRecord) {
          setIssuedCertMap((prev) => ({
            ...prev,
            [targetType]: issuedRecord!,
          }));
          setJustIssuedCert(issuedRecord);
          setShowSaveGuidePanel(true);
          if (onIssuedOrUpdated) {
            onIssuedOrUpdated(issuedRecord);
          }

          // For Premium/Ultimate or Design Re-save (no 5s PR modal), trigger immediate download on desktop
          // and show the synchronous save panel for mobile!
          if (!shouldShowSponsorPr) {
            if (!isMobileDevice) {
              triggerSynchronousFileDownload(
                issuedRecord.image_url,
                targetType,
                officialSerialStr
              );
            } else {
              toast.success(
                isDesignUpdate
                  ? '✨ デザインを更新しました！下のボタンから写真に保存できます'
                  : `🎉 公認証明書（${officialSerialStr}）を発行しました！下のボタンから保存してください`
              );
            }
          }
        }
      } catch (err) {
        console.error('Failed to issue certificate:', err);
        setIsPlayingAd(false);
        toast.error('証明書の発行中に通信エラーが発生しました。もう一度お試しください。');
      } finally {
        setIsIssuingServer(false);
      }
    },
    [
      island,
      user,
      hasVisitedIsland,
      issuedCertMap,
      isPremium,
      drawCertificate,
      onIssuedOrUpdated,
      isMobileDevice,
      triggerSynchronousFileDownload,
    ]
  );

  // Handle SNS Share (only allowed when activeIssuedCert exists!)
  const handleNativeShare = async () => {
    if (!activeIssuedCert) {
      toast('先に証明書を発行してからシェアしてください。', { icon: 'ℹ️' });
      return;
    }
    const text = `【キラ旅 到達証明】\n日本の離島「${island?.name}」への到達を正式証明！到達証明書（${assignedSerial}）を獲得しました 🏝️✨\n\n#キラ旅 #${island?.name || '離島'}到達証明書 #離島旅 #キラ旅島専科`;
    const slugOrId = island?.slug || island?.id;
    const shareUrl = window.location.origin
      ? `${window.location.origin}/island/${slugOrId}`
      : `https://island.kira-tabi.com/island/${slugOrId}`;

    if (navigator.share) {
      try {
        let shareData: ShareData = {
          title: `【キラ旅】${island?.name} 到達証明書`,
          text,
          url: shareUrl,
        };
        const file = latestPngFileRef.current;
        if (file && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
          shareData = { ...shareData, files: [file] };
        }
        await navigator.share(shareData);
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return;
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
          text
        )}&url=${encodeURIComponent(shareUrl)}`;
        window.open(twitterUrl, '_blank', 'noopener,noreferrer');
      }
    } else {
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        text
      )}&url=${encodeURIComponent(shareUrl)}`;
      window.open(twitterUrl, '_blank', 'noopener,noreferrer');
    }
  };

  if (!isOpen || !island) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6 lg:p-8 overflow-y-auto"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className={`w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] ${
            isVerified
              ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/60 border border-amber-400/50'
              : 'bg-slate-800 border border-slate-700'
          }`}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-700 bg-slate-900/90 sticky top-0 z-10">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  hasVisitedIsland
                    ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                }`}
              >
                <Award className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-serif font-bold text-base sm:text-lg text-white truncate">
                  {hasVisitedIsland
                    ? `${island.name} 公認到達証明書`
                    : `${island.name} 到達証明書（見本プレビュー）`}
                </h3>
                <p className="text-[11px] tracking-wider text-slate-400 truncate">
                  {activeIssuedCert
                    ? `発行済みシリアル ${assignedSerial} • 再ダウンロード無制限`
                    : 'KIRATABI OFFICIAL ARRIVAL CERTIFICATE'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full transition-colors text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
            {!isOrdering ? (
              <>
                {/* Monthly Quota & Issuance Status Bar (Logged-in Users) */}
                {user && (
                  <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                            effectiveTier === 'ultimate'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                              : effectiveTier === 'premium'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          {effectiveTier.toUpperCase()} PLAN
                        </span>
                        <span className="text-xs font-bold text-white">
                          今月の公式高画質枠:{' '}
                          {isLoadingQuota ? (
                            <span className="text-slate-400">確認中...</span>
                          ) : effectiveTier === 'ultimate' ? (
                            <span className="text-emerald-400">無制限</span>
                          ) : serverQuota ? (
                            <span
                              className={
                                (serverQuota.highQualityRemaining ?? 0) > 0
                                  ? 'text-emerald-400'
                                  : 'text-rose-400'
                              }
                            >
                              残り {serverQuota.highQualityRemaining} /{' '}
                              {serverQuota.highQualityMonthlyLimit} 枚
                            </span>
                          ) : (
                            <span className="text-slate-300">
                              {effectiveTier === 'premium' ? '月5枚' : '月1枚'}
                            </span>
                          )}
                        </span>
                        {serverTickets > 0 && (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                            🎫 追加チケット {serverTickets}枚保有
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">
                        ※一度発行した島の証明書は、枠消費なし・待ち時間なしでいつでも再ダウンロード＆写真・デザイン更新が可能です。
                      </p>
                    </div>
                    {effectiveTier !== 'ultimate' && (
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          type="button"
                          disabled={buyingTicketPack !== null}
                          onClick={() => handleBuyTicketPack('pack_3')}
                          className="px-3 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/40 text-emerald-300 font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                        >
                          {buyingTicketPack === 'pack_3' ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Ticket className="w-3.5 h-3.5" />
                          )}
                          🎫 買い切りチケット3枚 ¥450（期限なし）
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsPlanModalOpen(true)}
                          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 border border-amber-400/40 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Crown className="w-3.5 h-3.5" />
                          枠を増やす
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Customizer Inputs */}
                <div className="space-y-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-700/60">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-amber-400" /> 旅人ネーム
                      </label>
                      <input
                        type="text"
                        value={travelerName}
                        onChange={(e) => {
                          setTravelerName(e.target.value);
                          updateTravelerName(e.target.value);
                        }}
                        placeholder="お名前"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
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
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  {/* Certificate Configuration */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-3 border-t border-slate-700/60">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                        種類 (Type)
                      </label>
                      <div className="flex bg-slate-800 rounded-lg p-1 gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setCertificateType('card');
                            setLimitErrorMessage(null);
                          }}
                          className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-md transition-colors flex items-center justify-center gap-1 ${
                            certificateType === 'card'
                              ? 'bg-amber-500 text-slate-950'
                              : 'text-slate-300 hover:text-white'
                          }`}
                        >
                          <span>カード版(無料)</span>
                          {issuedCertMap.card && <CheckCircle className="w-3 h-3 shrink-0" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCertificateType('high_quality');
                            setLimitErrorMessage(null);
                          }}
                          className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-md transition-colors flex items-center justify-center gap-1 ${
                            certificateType === 'high_quality'
                              ? 'bg-amber-500 text-slate-950'
                              : 'text-slate-300 hover:text-white'
                          }`}
                        >
                          {isHighQualityQuotaExhausted && !issuedCertMap.high_quality && (
                            <Lock className="w-3 h-3 shrink-0" />
                          )}
                          <span>公式高画質版</span>
                          {issuedCertMap.high_quality && (
                            <CheckCircle className="w-3 h-3 shrink-0" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                        向き (Orientation)
                      </label>
                      <div className="flex bg-slate-800 rounded-lg p-1">
                        <button
                          type="button"
                          onClick={() => setOrientation('horizontal')}
                          className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${
                            orientation === 'horizontal'
                              ? 'bg-blue-500 text-white'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          横型 (A4比率)
                        </button>
                        <button
                          type="button"
                          onClick={() => setOrientation('vertical')}
                          className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${
                            orientation === 'vertical'
                              ? 'bg-blue-500 text-white'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          縦型 (スマホ壁紙)
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                        デザイン (Theme)
                      </label>
                      <select
                        value={designTheme}
                        onChange={(e) =>
                          setDesignTheme(e.target.value as 'classic' | 'modern' | 'vintage')
                        }
                        className="w-full bg-slate-800 border-none rounded-lg px-2 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="classic">クラシックゴールド</option>
                        <option value="modern">モダンサファイア</option>
                        <option value="vintage">ヴィンテージパーチメント</option>
                      </select>
                    </div>
                  </div>

                  {/* Photo Upload */}
                  <div className="pt-3 border-t border-slate-700/60">
                    <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
                      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        <Camera className="w-4 h-4 text-amber-400 shrink-0" />
                        <span className="text-xs text-slate-300 font-bold">思い出の写真を入れる:</span>
                        <input
                          type="file"
                          accept="image/*,.heic,.heif"
                          onChange={handleImageUpload}
                          className="text-xs text-slate-300 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-amber-500 file:text-slate-950 file:font-bold hover:file:bg-amber-400 cursor-pointer"
                        />
                        {customImage && (
                          <button
                            type="button"
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
                            写真を元に戻す
                          </button>
                        )}
                      </div>
                      {uploadError && (
                        <p className="text-xs text-rose-400 font-bold">{uploadError}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Canvas Preview Box */}
                <div className="flex flex-col items-center relative">
                  <div className="w-full flex items-center justify-between mb-2">
                    <p className="text-xs text-slate-400 tracking-widest uppercase flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                      {isCurrentSelectionLocked ? '見本プレビュー（透かし入り）' : '公式プレビュー'}
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsFullscreenPreview(true)}
                      className="text-xs font-bold text-blue-400 hover:text-blue-300"
                    >
                      拡大表示
                    </button>
                  </div>

                  <div
                    className="w-full bg-slate-950 p-3 sm:p-4 rounded-2xl border border-slate-700/60 shadow-inner flex items-center justify-center cursor-zoom-in overflow-hidden"
                    onClick={() => setIsFullscreenPreview(true)}
                  >
                    <canvas
                      ref={canvasRef}
                      className="max-w-full max-h-[380px] sm:max-h-[420px] w-auto h-auto object-contain rounded-lg shadow-2xl border border-slate-800 transition-all duration-300"
                    />
                  </div>
                </div>

                {/* Unified Issuance, Save & Re-Download Control Center */}
                <div className="bg-slate-900 border border-slate-700 p-4 sm:p-5 rounded-2xl space-y-4">
                  {/* CASE 1: Unvisited Island */}
                  {!hasVisitedIsland ? (
                    <div className="text-center p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2">
                      <div className="inline-flex items-center gap-1.5 text-amber-300 font-bold text-sm">
                        <Lock className="w-4 h-4" /> 未到達のため現在は「見本プレビュー」です
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        島のページで現地GPSチェックインまたは「行った！(到達)」を記録すると、透かしなしの公式到達証明書を発行・保存できます。
                      </p>
                    </div>
                  ) : !user ? (
                    /* CASE 2: Visited Locally, Not Logged In */
                    <div className="text-center p-4 bg-slate-800 border border-slate-700 rounded-xl space-y-3">
                      <p className="text-xs sm:text-sm text-slate-200 font-bold">
                        公式シリアル採番・証明書のダウンロード・マイページ永久保存には無料ログインが必要です
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsAuthModalOpen(true)}
                        className="py-3 px-6 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm rounded-xl transition-colors shadow-lg"
                      >
                        無料ログイン / アカウント作成して発行する
                      </button>
                    </div>
                  ) : activeIssuedCert ? (
                    /* CASE 3: ALREADY ISSUED FOR THIS ISLAND & TYPE -> UNLIMITED FREE RE-DOWNLOAD & DESIGN UPDATE! */
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3">
                        <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs sm:text-sm">
                          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                          <span>
                            {certificateType === 'high_quality' ? '公式高画質版' : 'カード版'} 発行済み（公認シリアル {assignedSerial}）
                          </span>
                        </div>
                        <span className="text-[11px] text-emerald-200/80">
                          枠消費なし・何度でも再保存可能
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {isMobileDevice && (
                          <button
                            type="button"
                            onClick={triggerMobilePhotoShare}
                            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all"
                          >
                            <Smartphone className="w-4 h-4 shrink-0" />
                            写真アプリに保存 / 共有（推奨）
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => triggerSynchronousFileDownload(activeIssuedCert.image_url)}
                          className={`w-full py-3.5 px-4 rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
                            isMobileDevice
                              ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-600'
                              : 'bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950'
                          }`}
                        >
                          <Download className="w-4 h-4 shrink-0" />
                          PNGを再ダウンロード（枠消費なし）
                        </button>
                        <button
                          type="button"
                          disabled={isIssuingServer}
                          onClick={() => executeOfficialIssuance(certificateType, true)}
                          className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all"
                        >
                          {isIssuingServer ? (
                            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                          ) : (
                            <RefreshCw className="w-4 h-4 shrink-0" />
                          )}
                          現在の名前・写真・向きでクラウド再保存
                        </button>
                        <button
                          type="button"
                          onClick={handleNativeShare}
                          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all"
                        >
                          <Share2 className="w-4 h-4 shrink-0" />
                          SNSで到達証明をシェア
                        </button>
                      </div>

                      {activeSponsor && (
                        <div className="bg-gradient-to-r from-amber-500/15 via-slate-800/90 to-amber-500/10 border border-amber-400/40 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-extrabold border border-amber-400/30">
                                {island.name} 公式パートナー特典
                              </span>
                              <span className="text-xs font-extrabold text-white truncate">
                                {activeSponsor.name}
                              </span>
                            </div>
                            {activeSponsor.perk_text && (
                              <p className="text-xs font-bold text-amber-200 leading-snug">
                                🎁 到達証明書ご提示特典: {activeSponsor.perk_text}
                              </p>
                            )}
                          </div>
                          {isValidSponsorMediaOrUrl(activeSponsor.official_website_url) && (
                            <a
                              href={activeSponsor.official_website_url.trim()}
                              target="_blank"
                              rel="noopener noreferrer sponsored"
                              onClick={() => handleSponsorClick(activeSponsor, 'certificate_post_save_reminder')}
                              className="shrink-0 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs inline-flex items-center justify-center gap-1 shadow transition-colors"
                            >
                              店舗・特典詳細を見る ↗
                            </a>
                          )}
                        </div>
                      )}

                      {/* Switch to High-Quality CTA if user currently only has Card issued and HQ is available */}
                      {certificateType === 'card' && !issuedCertMap.high_quality && (
                        <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-3">
                          <span className="text-xs text-slate-400">
                            A4印刷・ホログラム対応の「公式高画質版」も発行できます
                          </span>
                          <button
                            type="button"
                            onClick={() => setCertificateType('high_quality')}
                            className="shrink-0 text-xs font-bold text-amber-400 hover:text-amber-300 underline"
                          >
                            公式高画質版へ切替 →
                          </button>
                        </div>
                      )}
                    </div>
                  ) : certificateType === 'high_quality' && isHighQualityQuotaExhausted ? (
                    /* CASE 4A: High-Quality Monthly Quota Exhausted */
                    <div className="p-4 sm:p-5 bg-rose-500/10 border border-rose-500/30 rounded-xl space-y-3.5">
                      <div className="flex items-start gap-2.5">
                        <Lock className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="text-xs sm:text-sm font-bold text-rose-300">
                            今月の公式高画質版の発行枠（
                            {effectiveTier === 'premium' ? 'Premium: 月5枚' : 'Free: 月1枚'}
                            ）を使い切りました
                          </p>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            無料の「カード版」への切り替え、有効期限なしの「買い切り高画質チケット」、またはプランのアップグレード（Premium: 月5枚 / Ultimate: 無制限）をご利用いただけます。
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          disabled={buyingTicketPack !== null}
                          onClick={() => handleBuyTicketPack('pack_3')}
                          className="py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-lg transition-all disabled:opacity-50"
                        >
                          {buyingTicketPack === 'pack_3' ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Ticket className="w-4 h-4" />
                          )}
                          🎫 買い切りチケット3枚 ¥450（期限なし）
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsPlanModalOpen(true)}
                          className="py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Crown className="w-4 h-4" />
                          プランをアップグレード
                        </button>
                      </div>
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setCertificateType('card');
                            setLimitErrorMessage(null);
                          }}
                          className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs transition-colors"
                        >
                          カード版（無料）に切り替えて発行・保存
                        </button>
                        <button
                          type="button"
                          disabled={buyingTicketPack !== null}
                          onClick={() => handleBuyTicketPack('pack_10')}
                          className="text-xs font-bold text-emerald-300 hover:text-emerald-200 underline disabled:opacity-50"
                        >
                          {buyingTicketPack === 'pack_10'
                            ? '決済ページを準備中...'
                            : '10枚周遊お得パック ¥1,200（1枚あたり¥120・期限なし）はこちら →'}
                        </button>
                      </div>
                    </div>
                  ) : certificateType === 'card' && isCardDailyQuotaExhausted ? (
                    /* CASE 4B: Free Daily New-Island Card Cap Reached */
                    <div className="p-4 sm:p-5 bg-rose-500/10 border border-rose-500/30 rounded-xl space-y-3">
                      <p className="text-xs sm:text-sm font-bold text-rose-300">
                        本日の無料「カード版」新規発行上限（1日3島まで）に達しました
                      </p>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        ※すでに発行済みの島の証明書は、マイページや各島ページからいつでも無制限で再ダウンロードできます。明日以降に再度発行するか、回数無制限＆広告スキップのPremium / Ultimateプランをご検討ください。
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsPlanModalOpen(true)}
                        className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5"
                      >
                        <Crown className="w-4 h-4" />
                        Premium / Ultimateプランを見る
                      </button>
                    </div>
                  ) : (
                    /* CASE 5: Ready to Issue Official Certificate (Quota Available!) */
                    <div className="space-y-3">
                      {limitErrorMessage && (
                        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
                          {limitErrorMessage}
                        </div>
                      )}

                      <button
                        type="button"
                        disabled={isIssuingServer}
                        onClick={() => executeOfficialIssuance(certificateType, false)}
                        className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 disabled:opacity-60 text-slate-950 font-extrabold text-sm sm:text-base tracking-wide shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2.5 transition-all"
                      >
                        {isIssuingServer ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin shrink-0" />
                            <span>公認シリアル採番＆証明書を生成中...</span>
                          </>
                        ) : certificateType === 'high_quality' ? (
                          <>
                            <Sparkles className="w-5 h-5 shrink-0" />
                            <span>
                              公式高画質版を発行して保存する
                              {effectiveTier === 'ultimate'
                                ? '（無制限）'
                                : serverQuota && serverQuota.highQualityRemaining !== null
                                ? `（今月残り ${serverQuota.highQualityRemaining}枚${
                                    serverTickets > 0 ? ` + チケット${serverTickets}枚` : ''
                                  }）`
                                : ''}
                            </span>
                          </>
                        ) : (
                          <>
                            <Award className="w-5 h-5 shrink-0" />
                            <span>
                              【無料】カード版を発行して保存する
                              {effectiveTier === 'free' &&
                              serverQuota &&
                              serverQuota.cardDailyRemaining !== null
                                ? `（本日残り ${serverQuota.cardDailyRemaining}島）`
                                : ''}
                            </span>
                          </>
                        )}
                      </button>

                      <p className="text-[11px] text-slate-400 text-center">
                        {!isPremium
                          ? '※無料プランでは初回発行時に5秒間のスポンサーPRが表示されます（発行後の再ダウンロードは待ち時間ゼロ・無制限です）。'
                          : '※会員特典により広告スキップで即座に発行・マイページへ永久保存されます。'}
                      </p>
                    </div>
                  )}

                  {/* Long-Press Save Fallback Image (for iPhone / Android / LINE / Instagram in-app browsers) */}
                  {activeIssuedCert && (showSaveGuidePanel || isMobileDevice) && latestPreviewDataUrl && (
                    <div className="pt-3 border-t border-slate-800 space-y-2">
                      <p className="text-[11px] text-amber-300 font-bold flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 shrink-0" />
                        スマホ・LINE等でダウンロードできない場合は、下の証明書画像を「長押し」➔「写真に保存」でも保存できます：
                      </p>
                      <div className="bg-slate-950 p-2 rounded-xl border border-amber-500/30 flex justify-center">
                        <img
                          src={latestPreviewDataUrl}
                          alt={`${island.name} 到達証明書 (${assignedSerial})`}
                          className="max-h-56 w-auto rounded-lg object-contain select-auto"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Monetization Banner (Physical Mail Order — only for visited islands) */}
                {hasVisitedIsland && (
                  <div className="mt-4 bg-gradient-to-br from-amber-500/10 via-slate-800 to-amber-500/5 p-5 sm:p-6 rounded-3xl border border-amber-500/30 flex flex-col md:flex-row items-center justify-between gap-5">
                    <div className="space-y-1 text-center md:text-left">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold tracking-wider mb-1">
                        <Sparkles className="w-3.5 h-3.5" /> オフィシャル郵送オーダー
                      </div>
                      <h4 className="font-serif font-bold text-white text-base sm:text-lg">
                        世界にひとつだけの紙証明書をお手元へ
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed max-w-md">
                        高品質な厚紙・金箔押し調の印刷仕上げで、ご自宅やオフィスに飾れるオフィシャル紙証明書を郵送いたします（日本国内送料無料・通常3〜7営業日以内に発送）。
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsOrdering(true)}
                      className="shrink-0 px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-bold text-sm tracking-wider shadow-xl transition-all hover:scale-105"
                    >
                      郵送オーダーを申し込む →
                    </button>
                  </div>
                )}
              </>
            ) : (
              /* Physical Mail Order Flow */
              <div className="space-y-6 max-w-xl mx-auto py-4">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setIsOrdering(false)}
                    className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                  >
                    ← プレビューに戻る
                  </button>
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
                    Physical Certificate Order
                  </span>
                </div>

                {!orderSuccess ? (
                  <div className="space-y-6 bg-slate-900/60 p-6 rounded-3xl border border-slate-700">
                    <h4 className="font-serif font-bold text-white text-xl text-center">
                      プラン選択と配送先入力
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div
                        onClick={() => setOrderPlan('standard')}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                          orderPlan === 'standard'
                            ? 'border-amber-500 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                            : 'border-slate-700 bg-slate-800'
                        }`}
                      >
                        <span className="text-xs font-bold text-amber-400 block mb-1">
                          台紙付き (基本)
                        </span>
                        <div className="text-lg font-bold text-white mb-2">¥1,500</div>
                        <p className="text-[10px] text-slate-300">A4高品質印刷・特製台紙付き。</p>
                      </div>
                      <div
                        onClick={() => setOrderPlan('bundle_3')}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all relative ${
                          orderPlan === 'bundle_3'
                            ? 'border-emerald-400 bg-emerald-500/15 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                            : 'border-slate-700 bg-slate-800'
                        }`}
                      >
                        <span className="text-xs font-extrabold text-emerald-400 block mb-1">
                          3島まとめ刷りセット割 (¥3,800・¥700お得)
                        </span>
                        <div className="flex items-baseline gap-2 mb-2">
                          <span className="text-lg font-bold text-white">¥3,800</span>
                          <span className="text-[10px] text-slate-400 line-through">¥4,500</span>
                        </div>
                        <p className="text-[10px] text-slate-300">
                          訪問済み最大3島分のA4高品質印刷・特製台紙セット。
                        </p>
                      </div>
                      <div
                        onClick={() => setOrderPlan('frame_simple')}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                          orderPlan === 'frame_simple'
                            ? 'border-amber-500 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                            : 'border-slate-700 bg-slate-800'
                        }`}
                      >
                        <span className="text-xs font-bold text-amber-400 block mb-1">
                          簡易フレーム [OP]
                        </span>
                        <div className="text-lg font-bold text-white mb-2">¥3,000</div>
                        <p className="text-[10px] text-slate-300">
                          壁掛け・卓上両対応の軽量フレーム。
                        </p>
                      </div>
                      <div
                        onClick={() => setOrderPlan('frame_wood')}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                          orderPlan === 'frame_wood'
                            ? 'border-amber-500 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                            : 'border-slate-700 bg-slate-800'
                        }`}
                      >
                        <span className="text-xs font-bold text-amber-400 block mb-1">
                          高級木製フレーム [OP]
                        </span>
                        <div className="text-lg font-bold text-white mb-2">¥6,000</div>
                        <p className="text-[10px] text-slate-300">重厚感のある木製フレーム装飾。</p>
                      </div>
                      <div
                        onClick={() => setOrderPlan('frame_acrylic')}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all sm:col-span-2 ${
                          orderPlan === 'frame_acrylic'
                            ? 'border-amber-500 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                            : 'border-slate-700 bg-slate-800'
                        }`}
                      >
                        <span className="text-xs font-bold text-amber-400 block mb-1">
                          アクリル額装プレミアム [OP]
                        </span>
                        <div className="text-lg font-bold text-white mb-2">¥10,000</div>
                        <p className="text-[10px] text-slate-300">浮き出し加工の最高級アクリル額。</p>
                      </div>
                    </div>

                    {orderPlan === 'bundle_3' && (
                      <div className="bg-emerald-950/30 border border-emerald-500/30 p-4 rounded-2xl space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-extrabold text-emerald-300">
                            🏝️ 3島まとめ刷りセットの対象島（1枚目: {island.name}）
                          </span>
                          <span className="text-[10px] text-slate-400">任意指定</span>
                        </div>
                        <datalist id="kiratabi-visited-islands-datalist">
                          {visitedIslandOptions.map((islName) => (
                            <option key={islName} value={islName} />
                          ))}
                        </datalist>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="block text-[11px] font-bold text-slate-300">
                              追加する訪問済みの島 2枚目
                            </label>
                            {visitedIslandOptions.length > 0 && (
                              <select
                                value={visitedIslandOptions.includes(bundleIsland2) ? bundleIsland2 : ''}
                                onChange={(e) => {
                                  if (e.target.value) setBundleIsland2(e.target.value);
                                }}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-400"
                              >
                                <option value="">訪問履歴から選択...</option>
                                {visitedIslandOptions.map((islName) => (
                                  <option key={`b2-${islName}`} value={islName}>
                                    {islName}
                                  </option>
                                ))}
                              </select>
                            )}
                            <input
                              type="text"
                              list="kiratabi-visited-islands-datalist"
                              value={bundleIsland2}
                              onChange={(e) => setBundleIsland2(e.target.value)}
                              placeholder="例: 池間島（訪問済みの島名）"
                              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-400"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="block text-[11px] font-bold text-slate-300">
                              追加する訪問済みの島 3枚目
                            </label>
                            {visitedIslandOptions.length > 0 && (
                              <select
                                value={visitedIslandOptions.includes(bundleIsland3) ? bundleIsland3 : ''}
                                onChange={(e) => {
                                  if (e.target.value) setBundleIsland3(e.target.value);
                                }}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-400"
                              >
                                <option value="">訪問履歴から選択...</option>
                                {visitedIslandOptions.map((islName) => (
                                  <option key={`b3-${islName}`} value={islName}>
                                    {islName}
                                  </option>
                                ))}
                              </select>
                            )}
                            <input
                              type="text"
                              list="kiratabi-visited-islands-datalist"
                              value={bundleIsland3}
                              onChange={(e) => setBundleIsland3(e.target.value)}
                              placeholder="例: 大神島（訪問済みの島名）"
                              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-400"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700">
                        <label className="block text-xs font-bold text-slate-400 mb-3">
                          デザイン方向
                        </label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setOrderDesign('horizontal')}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                              orderDesign === 'horizontal'
                                ? 'bg-amber-500 text-slate-900'
                                : 'bg-slate-900 text-slate-400'
                            }`}
                          >
                            横版
                          </button>
                          <button
                            type="button"
                            onClick={() => setOrderDesign('vertical')}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                              orderDesign === 'vertical'
                                ? 'bg-amber-500 text-slate-900'
                                : 'bg-slate-900 text-slate-400'
                            }`}
                          >
                            縦版
                          </button>
                        </div>
                      </div>
                      <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700">
                        <label className="block text-xs font-bold text-slate-400 mb-3">
                          ラミネート加工 (+¥300)
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-white">
                          <input
                            type="checkbox"
                            checked={isLaminated}
                            onChange={(e) => setIsLaminated(e.target.checked)}
                            className="w-5 h-5 rounded text-amber-500 bg-slate-900 border-slate-600 focus:ring-amber-400"
                          />
                          追加する (耐久性・光沢UP)
                        </label>
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-700/50">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1">
                          配送先地域
                        </label>
                        <select
                          value={recipientCountry}
                          onChange={(e) => setRecipientCountry(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                        >
                          <option value="Japan">日本国内 (Japan・送料無料)</option>
                        </select>
                        <p className="text-[11px] text-slate-400 mt-1">
                          ※現在、郵送証明書は日本国内のみ（全国送料無料・通常3〜7営業日以内に発送）承っております。
                        </p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-400 mb-1">
                            郵便番号
                          </label>
                          <input
                            type="text"
                            value={postalCode}
                            onChange={handlePostalCodeChange}
                            placeholder="例: 1000001 (ハイフンなし)"
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-400 mb-1">
                            電話番号 / Phone Number
                          </label>
                          <input
                            type="text"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="例: 090-1234-5678"
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1">
                          住所 / Address (自動入力可)
                        </label>
                        <input
                          type="text"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="都道府県・市区町村・番地・マンション名"
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1">
                          お名前 / Full Name
                        </label>
                        <input
                          type="text"
                          value={recipientName}
                          onChange={(e) => setRecipientName(e.target.value)}
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
                      type="button"
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
                      「{island.name}」の到達証明書のオーダーおよび連番シリアル発行が確定いたしました。ご指定住所宛に通常3〜7営業日以内に発送いたします。
                    </p>
                    <button
                      type="button"
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
            className="fixed inset-0 z-[10500] bg-slate-950/95 backdrop-blur-xl flex flex-col"
          >
            <div className="flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800">
              <h3 className="text-white font-bold text-sm">証明書プレビュー (拡大表示)</h3>
              <button
                type="button"
                onClick={() => setIsFullscreenPreview(false)}
                className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div
              className="flex-1 overflow-auto p-4 flex items-center justify-center cursor-zoom-out"
              onClick={() => setIsFullscreenPreview(false)}
            >
              <canvas
                ref={fullscreenCanvasRef}
                className="max-w-full max-h-[82vh] w-auto h-auto object-contain rounded-lg shadow-2xl border border-slate-800"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Official Sponsor PR & Synchronous Mobile Save Completion Overlay */}
      <AnimatePresence>
        {isPlayingAd && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[11000] bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-5 overflow-y-auto"
          >
            <div className="mb-4 text-white font-mono text-xs sm:text-sm bg-slate-900/90 px-4 py-2 rounded-xl border border-amber-500/30 shadow-lg">
              {adTimeLeft > 0 || isIssuingServer
                ? `公認シリアル採番＆証明書を生成中... ${adTimeLeft > 0 ? `残り ${adTimeLeft}秒` : ''}`
                : `🎉 公認到達証明書（${assignedSerial}）の発行が完了しました！`}
            </div>

            {/* Official Sponsor & Premium PR Card */}
            {activeSponsor ? (
              <div className="w-full max-w-lg bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-2xl overflow-hidden border border-amber-500/50 relative shadow-2xl flex flex-col items-center text-center">
                {(() => {
                  const mediaUrl = isValidSponsorMediaOrUrl(activeSponsor.banner_photo_url)
                    ? activeSponsor.banner_photo_url.trim()
                    : isValidSponsorMediaOrUrl(activeSponsor.logo_url)
                    ? activeSponsor.logo_url.trim()
                    : null;
                  return mediaUrl ? (
                    <div className="w-full h-44 sm:h-52 bg-slate-950 overflow-hidden relative border-b border-amber-500/30">
                      <img
                        src={mediaUrl}
                        alt={activeSponsor.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : null;
                })()}

                <div className="p-5 sm:p-6 w-full flex flex-col items-center space-y-3">
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <span className="px-3 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-extrabold tracking-wider">
                      {island.name} 公式パートナー PR
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider border ${
                        activeSponsor.sponsor_tier === 'GOLD'
                          ? 'bg-amber-400 text-slate-950 border-amber-300'
                          : activeSponsor.sponsor_tier === 'SILVER'
                          ? 'bg-slate-700 text-slate-100 border-slate-500'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {activeSponsor.sponsor_tier === 'GOLD'
                        ? 'GOLD SPONSOR'
                        : activeSponsor.sponsor_tier === 'SILVER'
                        ? 'SILVER SPONSOR'
                        : 'OFFICIAL PARTNER'}
                    </span>
                  </div>

                  <div>
                    <h2 className="text-lg sm:text-2xl font-bold font-serif text-white tracking-wide">
                      {activeSponsor.name}
                    </h2>
                    {activeSponsor.category_detail && (
                      <p className="text-xs font-bold text-sky-300 mt-1">
                        {activeSponsor.category_detail}
                      </p>
                    )}
                  </div>

                  {activeSponsor.perk_text && (
                    <div className="w-full bg-amber-500/15 border border-amber-400/50 rounded-xl px-4 py-3 text-left shadow-inner">
                      <p className="text-xs sm:text-sm font-extrabold text-amber-200 leading-relaxed">
                        🎁 到達証明書ご提示特典: {activeSponsor.perk_text}
                      </p>
                    </div>
                  )}

                  {isValidSponsorMediaOrUrl(activeSponsor.official_website_url) && (
                    <a
                      href={activeSponsor.official_website_url.trim()}
                      target="_blank"
                      rel="noopener noreferrer sponsored"
                      onClick={() => handleSponsorClick(activeSponsor, 'certificate_5s_cm')}
                      className="mt-1 inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-extrabold text-xs sm:text-sm shadow-lg transition-all"
                    >
                      <span>店舗・特典詳細を見る ↗</span>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    </a>
                  )}

                  {(adTimeLeft > 0 || isIssuingServer) && (
                    <div className="pt-2 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                      <div
                        className="w-2 h-2 rounded-full bg-amber-400 animate-ping"
                        style={{ animationDelay: '0.2s' }}
                      />
                      <div
                        className="w-2 h-2 rounded-full bg-amber-400 animate-ping"
                        style={{ animationDelay: '0.4s' }}
                      />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="w-full max-w-lg bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-2xl overflow-hidden border border-amber-500/40 relative shadow-2xl p-6 flex flex-col items-center justify-center text-center">
                <span className="px-3 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-bold tracking-widest uppercase mb-3">
                  KIRATABI OFFICIAL SPONSOR PR
                </span>
                <Sparkles className="w-10 h-10 mb-3 text-amber-400 animate-pulse" />
                <h2 className="text-lg sm:text-2xl font-bold font-serif text-white mb-2 tracking-wide">
                  輝旅 島専科 プレミアムパスポート
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 max-w-md leading-relaxed">
                  Premiumなら待ち時間ゼロ＆公式高画質版を月5枚まで、Ultimateなら無制限に即時発行！さらに特製の金箔調・公式紙証明書の郵送オーダー（1枚 ¥1,500〜）もご注文いただけます。
                </p>
                {(adTimeLeft > 0 || isIssuingServer) && (
                  <div className="mt-5 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    <div
                      className="w-2 h-2 rounded-full bg-amber-400 animate-ping"
                      style={{ animationDelay: '0.2s' }}
                    />
                    <div
                      className="w-2 h-2 rounded-full bg-amber-400 animate-ping"
                      style={{ animationDelay: '0.4s' }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Fresh Synchronous User-Gesture Save Buttons once countdown & server issuance finish */}
            {adTimeLeft === 0 && !isIssuingServer && justIssuedCert && (
              <div className="mt-6 w-full max-w-lg bg-slate-900 border border-emerald-500/40 rounded-2xl p-5 space-y-3 shadow-2xl">
                <p className="text-center text-emerald-300 font-bold text-sm">
                  ✓ マイページへのクラウド保存完了（{assignedSerial}）
                </p>

                {activeSponsor && (
                  <div className="bg-amber-500/10 border border-amber-400/40 rounded-xl px-3.5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-left">
                    <div className="min-w-0">
                      <p className="text-[11px] font-extrabold text-amber-300 truncate">
                        🎁 {activeSponsor.name}
                      </p>
                      {activeSponsor.perk_text && (
                        <p className="text-[11px] text-slate-200 line-clamp-2">
                          到達証明書ご提示特典: {activeSponsor.perk_text}
                        </p>
                      )}
                    </div>
                    {isValidSponsorMediaOrUrl(activeSponsor.official_website_url) && (
                      <a
                        href={activeSponsor.official_website_url.trim()}
                        target="_blank"
                        rel="noopener noreferrer sponsored"
                        onClick={() => handleSponsorClick(activeSponsor, 'certificate_save_box_reminder')}
                        className="shrink-0 px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-[11px] text-center"
                      >
                        店舗・特典詳細を見る ↗
                      </a>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {isMobileDevice && (
                    <button
                      type="button"
                      onClick={async () => {
                        await triggerMobilePhotoShare();
                        setIsPlayingAd(false);
                      }}
                      className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-extrabold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg"
                    >
                      <Smartphone className="w-4 h-4 shrink-0" />
                      写真アプリに保存 / 共有
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      triggerSynchronousFileDownload(
                        justIssuedCert.image_url,
                        certificateType,
                        assignedSerial
                      );
                      setIsPlayingAd(false);
                    }}
                    className="w-full py-3.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg"
                  >
                    <Download className="w-4 h-4 shrink-0" />
                    PNGファイルとして保存
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPlayingAd(false)}
                  className="w-full py-2 text-xs text-slate-400 hover:text-white transition-colors"
                >
                  証明書プレビュー画面に戻る（あとからでも保存可能）
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={() => {
          setIsAuthModalOpen(false);
          void refreshServerCertificateState(true);
        }}
      />

      <PlanChangeModal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        currentTier={effectiveTier}
        onPlanChanged={(newTier) => {
          setServerTier(newTier);
          setIsPlanModalOpen(false);
          toast.success(`KIRATABI ${newTier === 'ultimate' ? 'Ultimate' : 'Premium'} に変更しました！`);
          void refreshServerCertificateState(true);
        }}
      />
    </AnimatePresence>
  );
}
