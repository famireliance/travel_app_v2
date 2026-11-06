import React, { useState, useEffect, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  Palmtree,
  Plus,
  Trash2,
  MapPin,
  Upload,
  Search,
  Save,
  X,
  ExternalLink,
  Edit3,
  Camera,
  Smartphone,
  Monitor,
  CheckCircle2,
  Image as ImageIcon,
  LayoutGrid,
  ListFilter,
  Sparkles,
  Crosshair,
} from 'lucide-react';
import { getVerifiedIslandPhotos } from '@/lib/islandPhoto';
import regionsData from '@/data/regions.json';

interface IslandData {
  id: string;
  name: string;
  region_id: string;
  prefecture: string;
  coordinates: string;
  description: string;
  access: string;
  difficulty: string;
  points: number;
  checkin_radius_m: number;
  hero_image_url?: string;
  thumbnail_url?: string;
  hero_image_mobile_url?: string;
  gallery_urls?: string[];
  photo_focal_point?: string;
  mobile_display_mode?: 'contain_blur' | 'cover';
  photo_caption?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  practical_info?: Record<string, any>;
}

/**
 * ブラウザ側で高解像度写真（iPhone/一眼カメラ等の大サイズJPEG/PNG）を
 * 高画質WebP（最大長辺1920px）に自動最適化し、縦横向き（landscape / portrait）を自動判定する。
 */
async function optimizeAndDetectPhoto(
  file: File
): Promise<{ optimizedFile: File; orientation: 'landscape' | 'portrait'; width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const origW = img.naturalWidth || img.width || 1200;
      const origH = img.naturalHeight || img.height || 800;
      const orientation: 'landscape' | 'portrait' = origW >= origH ? 'landscape' : 'portrait';

      const MAX_DIM = 1920;
      let targetW = origW;
      let targetH = origH;

      if (origW > MAX_DIM || origH > MAX_DIM) {
        if (origW >= origH) {
          targetW = MAX_DIM;
          targetH = Math.round((origH * MAX_DIM) / origW);
        } else {
          targetH = MAX_DIM;
          targetW = Math.round((origW * MAX_DIM) / origH);
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve({ optimizedFile: file, orientation, width: origW, height: origH });
        return;
      }

      ctx.drawImage(img, 0, 0, targetW, targetH);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve({ optimizedFile: file, orientation, width: origW, height: origH });
            return;
          }
          const cleanName = file.name.replace(/\.[^.]+$/, '') + '.webp';
          const optimizedFile = new File([blob], cleanName, { type: 'image/webp' });
          resolve({ optimizedFile, orientation, width: targetW, height: targetH });
        },
        'image/webp',
        0.86
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ optimizedFile: file, orientation: 'landscape', width: 1200, height: 800 });
    };

    img.src = objectUrl;
  });
}

export default function IslandManagement({ password }: { password: string }) {
  const [islands, setIslands] = useState<IslandData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [photoFilter, setPhotoFilter] = useState<'all' | 'missing' | 'registered'>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'editor' | 'quick_grid'>('editor');

  // Form State
  const [selectedIsland, setSelectedIsland] = useState<IslandData | null>(null);
  const [formData, setFormData] = useState<IslandData>({
    id: '',
    name: '',
    region_id: 'yaeyama',
    prefecture: '沖縄県',
    coordinates: '24.3406, 124.1561',
    description: '',
    access: '',
    difficulty: '中級',
    points: 10,
    checkin_radius_m: 3000,
    hero_image_url: '',
    thumbnail_url: '',
    hero_image_mobile_url: '',
    gallery_urls: [],
    photo_focal_point: '50% 50%',
    mobile_display_mode: 'contain_blur',
    photo_caption: '',
  });

  // Map modal state
  const [showMapModal, setShowMapModal] = useState(false);

  // Uploading state
  const [uploading, setUploading] = useState(false);
  const [quickUploadingId, setQuickUploadingId] = useState<string | null>(null);
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('mobile');

  const fetchIslands = useCallback(
    async (searchVal: string) => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/admin/islands?limit=500&search=${encodeURIComponent(searchVal)}`, {
          headers: { 'x-admin-password': password },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setIslands(data.data || []);
      } catch (err: any) {
        toast.error(`島データの取得に失敗しました: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    },
    [password]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchIslands(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, fetchIslands]);

  const filteredIslands = useMemo(() => {
    return islands.filter((isl) => {
      if (regionFilter !== 'all' && isl.region_id !== regionFilter && isl.prefecture !== regionFilter) {
        return false;
      }
      const meta = getVerifiedIslandPhotos(isl);
      if (photoFilter === 'missing' && meta.hasVerifiedPhoto) return false;
      if (photoFilter === 'registered' && !meta.hasVerifiedPhoto) return false;
      return true;
    });
  }, [islands, regionFilter, photoFilter]);

  const photoStats = useMemo(() => {
    let registered = 0;
    let withMobilePortrait = 0;
    for (const isl of islands) {
      const meta = getVerifiedIslandPhotos(isl);
      if (meta.hasVerifiedPhoto) registered++;
      if (meta.mobileUrl) withMobilePortrait++;
    }
    return {
      total: islands.length,
      registered,
      missing: Math.max(0, islands.length - registered),
      withMobilePortrait,
    };
  }, [islands]);

  const handleEdit = (island: IslandData) => {
    setSelectedIsland(island);
    const meta = getVerifiedIslandPhotos(island);
    setFormData({
      id: island.id || '',
      name: island.name || '',
      region_id: island.region_id || '',
      prefecture: island.prefecture || '',
      coordinates: island.coordinates || '',
      description: island.description || '',
      access: island.access || '',
      difficulty: island.difficulty || '中級',
      points: island.points || 10,
      checkin_radius_m: island.checkin_radius_m || 3000,
      hero_image_url: island.hero_image_url || meta.desktopUrl || '',
      thumbnail_url: island.hero_image_url || meta.desktopUrl || '',
      hero_image_mobile_url: island.hero_image_mobile_url || meta.mobileUrl || '',
      gallery_urls: Array.isArray(island.gallery_urls) && island.gallery_urls.length > 0 ? island.gallery_urls : meta.galleryUrls,
      photo_focal_point: island.photo_focal_point || meta.focalPoint || '50% 50%',
      mobile_display_mode: island.mobile_display_mode || meta.mobileDisplayMode || 'contain_blur',
      photo_caption: island.photo_caption || meta.caption || '',
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const isNew = !selectedIsland;
    try {
      const payload = {
        ...formData,
        hero_image_url: formData.hero_image_url || formData.thumbnail_url || '',
        thumbnail_url: formData.hero_image_url || formData.thumbnail_url || '',
      };

      const res = await fetch('/api/admin/islands', {
        method: isNew ? 'POST' : 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(data.message || '島データ・現地写真を保存しました');
      if (data.data) {
        setIslands((prev) => prev.map((item) => (item.id === data.data.id ? data.data : item)));
        setSelectedIsland(data.data);
      } else {
        fetchIslands(search);
      }
    } catch (err: any) {
      toast.error(`保存エラー: ${err.message}`);
    }
  };

  const handleDelete = async (island: IslandData) => {
    if (!window.confirm(`本当に「${island.name}」(ID: ${island.id}) のデータを削除しますか？`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/islands?id=${encodeURIComponent(island.id)}`, {
        method: 'DELETE',
        headers: { 'x-admin-password': password },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(data.message || '削除しました');
      if (selectedIsland?.id === island.id) setSelectedIsland(null);
      fetchIslands(search);
    } catch (err: any) {
      toast.error(`削除エラー: ${err.message}`);
    }
  };

  /**
   * 単一または複数ファイルのアップロード処理（自動WebP最適化＋縦横自動判定対応）
   */
  const uploadSingleFile = async (
    file: File,
    islandId: string,
    photoType: 'desktop' | 'mobile' | 'gallery' | 'auto'
  ): Promise<{ url: string; orientation: 'landscape' | 'portrait' }> => {
    const { optimizedFile, orientation } = await optimizeAndDetectPhoto(file);
    const body = new FormData();
    body.append('file', optimizedFile);
    body.append('bucket', 'islands');
    body.append('islandId', islandId || 'island');
    body.append('photoType', photoType === 'auto' ? orientation : photoType);

    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      headers: { 'x-admin-password': password },
      body,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return { url: data.url, orientation };
  };

  /**
   * 編集フォーム内でのスロット別アップロード ('desktop' | 'mobile' | 'gallery' | 'auto')
   */
  const handleSlotUpload = async (
    files: FileList | null,
    targetSlot: 'desktop' | 'mobile' | 'gallery' | 'auto'
  ) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const toastId = toast.loading(`${files.length}枚の現地写真を最適化・アップロード中...`);

    try {
      let nextDesktop = formData.hero_image_url || '';
      let nextMobile = formData.hero_image_mobile_url || '';
      const nextGallery = [...(formData.gallery_urls || [])];

      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const { url, orientation } = await uploadSingleFile(f, formData.id || 'new', targetSlot);

        if (targetSlot === 'desktop') {
          nextDesktop = url;
          if (!nextGallery.includes(url)) nextGallery.unshift(url);
        } else if (targetSlot === 'mobile') {
          nextMobile = url;
          if (!nextDesktop) nextDesktop = url;
        } else if (targetSlot === 'gallery') {
          if (!nextGallery.includes(url)) nextGallery.push(url);
          if (!nextDesktop) nextDesktop = url;
        } else {
          // 'auto': 写真の縦横比を自動判定して最適な枠へ振り分け！
          if (orientation === 'portrait') {
            nextMobile = url;
            if (!nextDesktop) nextDesktop = url;
          } else {
            nextDesktop = url;
          }
          if (!nextGallery.includes(url)) nextGallery.push(url);
        }
      }

      setFormData((prev) => ({
        ...prev,
        hero_image_url: nextDesktop,
        thumbnail_url: nextDesktop,
        hero_image_mobile_url: nextMobile,
        gallery_urls: nextGallery,
      }));

      toast.success('現地写真のアップロードが完了しました（「島データを保存する」で確定します）', {
        id: toastId,
      });
    } catch (err: any) {
      toast.error(`アップロード失敗: ${err.message}`, { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  /**
   * クイック写真一括登録グリッド用：島カードに写真をドロップまたは選択したら即座にアップロード＆DB保存まで一括実行！
   */
  const handleQuickCardUpload = async (island: IslandData, files: FileList | null) => {
    if (!files || files.length === 0) return;
    setQuickUploadingId(island.id);
    const toastId = toast.loading(`「${island.name}」の現地写真をアップロード＆保存中...`);

    try {
      const existingMeta = getVerifiedIslandPhotos(island);
      let nextDesktop = island.hero_image_url || existingMeta.desktopUrl || '';
      let nextMobile = island.hero_image_mobile_url || existingMeta.mobileUrl || '';
      const nextGallery = [...(island.gallery_urls || existingMeta.galleryUrls || [])];

      for (let i = 0; i < files.length; i++) {
        const { url, orientation } = await uploadSingleFile(files[i], island.id, 'auto');
        if (orientation === 'portrait') {
          nextMobile = url;
          if (!nextDesktop) nextDesktop = url;
        } else {
          nextDesktop = url;
        }
        if (!nextGallery.includes(url)) nextGallery.push(url);
      }

      const saveRes = await fetch('/api/admin/islands', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
        body: JSON.stringify({
          id: island.id,
          hero_image_url: nextDesktop,
          hero_image_mobile_url: nextMobile,
          gallery_urls: nextGallery,
        }),
      });
      const saveData = await saveRes.json();
      if (!saveRes.ok) throw new Error(saveData.error);

      setIslands((prev) => prev.map((item) => (item.id === island.id ? saveData.data : item)));
      if (selectedIsland?.id === island.id) {
        handleEdit(saveData.data);
      }
      toast.success(`✅ 「${island.name}」の現地写真を即時反映しました！`, { id: toastId });
    } catch (err: any) {
      toast.error(`エラー: ${err.message}`, { id: toastId });
    } finally {
      setQuickUploadingId(null);
    }
  };

  /**
   * プレビュー画像クリックで焦点位置 (object-position) を設定
   */
  const handleFocalPointClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const yPct = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    const clampedX = Math.max(0, Math.min(100, xPct));
    const clampedY = Math.max(0, Math.min(100, yPct));
    setFormData((prev) => ({
      ...prev,
      photo_focal_point: `${clampedX}% ${clampedY}%`,
    }));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header & Stats Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-800 pb-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Palmtree className="w-6 h-6 text-emerald-400" />
            島マスターデータ ＆ 現地実写フォトスタジオ
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            「現地以外の写真は一切使わない」厳格ポリシー対応。PC用（横写真）とスマホ用（縦写真・パノラマ表示）を直感的に管理できます。
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* モード切替タブ */}
          <div className="flex bg-gray-900 border border-gray-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode('editor')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                viewMode === 'editor'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" /> 詳細編集＆プレビュー
            </button>
            <button
              type="button"
              onClick={() => setViewMode('quick_grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                viewMode === 'quick_grid'
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> ⚡ クイック写真一括登録グリッド
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setSelectedIsland(null);
              setViewMode('editor');
              setFormData({
                id: '',
                name: '',
                region_id: 'yaeyama',
                prefecture: '沖縄県',
                coordinates: '24.3406, 124.1561',
                description: '',
                access: '',
                difficulty: '中級',
                points: 10,
                checkin_radius_m: 3000,
                hero_image_url: '',
                thumbnail_url: '',
                hero_image_mobile_url: '',
                gallery_urls: [],
                photo_focal_point: '50% 50%',
                mobile_display_mode: 'contain_blur',
                photo_caption: '',
              });
            }}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow flex items-center gap-1.5 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            新規島データ作成
          </button>
        </div>
      </div>

      {/* 現地写真カバレッジ統計 & クイックフィルタバー */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setPhotoFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
              photoFilter === 'all'
                ? 'bg-white text-gray-900 border-white'
                : 'bg-gray-950 text-gray-400 border-gray-800 hover:border-gray-700'
            }`}
          >
            すべて ({photoStats.total}島)
          </button>
          <button
            type="button"
            onClick={() => setPhotoFilter('missing')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
              photoFilter === 'missing'
                ? 'bg-amber-500 text-gray-950 border-amber-400'
                : 'bg-gray-950 text-amber-400 border-gray-800 hover:border-amber-500/40'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            📷 写真未登録のみ ({photoStats.missing}島)
          </button>
          <button
            type="button"
            onClick={() => setPhotoFilter('registered')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
              photoFilter === 'registered'
                ? 'bg-emerald-500 text-gray-950 border-emerald-400'
                : 'bg-gray-950 text-emerald-400 border-gray-800 hover:border-emerald-500/40'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            ✅ 現地写真登録済み ({photoStats.registered}島 / 縦写真: {photoStats.withMobilePortrait}島)
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-gray-950 border border-gray-800 rounded-xl px-3 py-1.5">
            <ListFilter className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="bg-transparent text-xs text-white focus:outline-none"
            >
              <option value="all" className="bg-gray-900">すべての諸島・エリア</option>
              {regionsData.map((r) => (
                <option key={r.id} value={r.id} className="bg-gray-900">
                  {r.name} ({r.area})
                </option>
              ))}
            </select>
          </div>

          <div className="relative w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="島名・都道府県で検索..."
              className="w-full bg-gray-950 border border-gray-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* =====================================================================
          MODE B: ⚡ クイック写真一括ドロップ登録グリッドモード
         ===================================================================== */}
      {viewMode === 'quick_grid' ? (
        <div className="space-y-4">
          <div className="bg-cyan-950/30 border border-cyan-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-cyan-200 space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-cyan-300">
                <Sparkles className="w-4 h-4" />
                お手持ちの現地写真をカードに直接ドラッグ＆ドロップ（またはボタン選択）するだけで即座に保存されます！
              </p>
              <p className="text-gray-400">
                ・横長写真をドロップ → 自動で<strong>PC・共通メイン写真</strong>に登録 ／ 縦長写真をドロップ → 自動で<strong>スマホ専用縦写真</strong>に登録（複数枚同時ドロップでギャラリーにも自動追加）
              </p>
            </div>
            <span className="text-xs font-mono text-cyan-300 shrink-0">
              表示中: {filteredIslands.length}島
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[75vh] overflow-y-auto pr-1">
            {filteredIslands.map((island) => {
              const meta = getVerifiedIslandPhotos(island);
              const isBusy = quickUploadingId === island.id;

              return (
                <div
                  key={island.id}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleQuickCardUpload(island, e.dataTransfer.files);
                  }}
                  className="bg-gray-900 border border-gray-800 hover:border-cyan-500/50 rounded-2xl overflow-hidden flex flex-col justify-between transition group"
                >
                  <div className="relative h-36 bg-gray-950 overflow-hidden">
                    {meta.hasVerifiedPhoto ? (
                      <img
                        src={meta.desktopUrl || meta.mobileUrl || ''}
                        alt={island.name}
                        style={{ objectPosition: meta.focalPoint }}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 gap-1 p-3 text-center">
                        <Camera className="w-6 h-6 text-gray-600" />
                        <span className="text-[11px] font-bold text-gray-400">現地写真 未登録</span>
                        <span className="text-[10px] text-gray-600">ここに写真をドロップ</span>
                      </div>
                    )}

                    {/* バッジ群 */}
                    <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                      {meta.desktopUrl && (
                        <span className="px-2 py-0.5 rounded bg-emerald-950/90 border border-emerald-500/40 text-[10px] font-bold text-emerald-300 flex items-center gap-1">
                          <Monitor className="w-2.5 h-2.5" /> 横写真
                        </span>
                      )}
                      {meta.mobileUrl && (
                        <span className="px-2 py-0.5 rounded bg-cyan-950/90 border border-cyan-500/40 text-[10px] font-bold text-cyan-300 flex items-center gap-1">
                          <Smartphone className="w-2.5 h-2.5" /> 縦写真
                        </span>
                      )}
                      {meta.galleryUrls.length > 1 && (
                        <span className="px-1.5 py-0.5 rounded bg-black/75 text-[10px] font-bold text-white">
                          計{meta.galleryUrls.length}枚
                        </span>
                      )}
                    </div>

                    {isBusy && (
                      <div className="absolute inset-0 bg-black/75 flex items-center justify-center text-xs font-bold text-cyan-300">
                        アップロード中...
                      </div>
                    )}
                  </div>

                  <div className="p-3.5 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[10px] text-gray-400">{island.prefecture} / {island.region_id}</p>
                        <h4 className="font-bold text-sm text-white">{island.name}</h4>
                      </div>
                      <a
                        href={`/island/${island.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300"
                        title="実際のページを確認"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="flex-1 cursor-pointer bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 py-1.5 px-2.5 rounded-xl text-[11px] font-bold text-center transition flex items-center justify-center gap-1">
                        <Upload className="w-3 h-3" />
                        写真を追加
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          disabled={isBusy}
                          onChange={(e) => handleQuickCardUpload(island, e.target.files)}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          handleEdit(island);
                          setViewMode('editor');
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 text-[11px] font-bold transition"
                      >
                        詳細・調整
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* =====================================================================
            MODE A: 📋 詳細編集 ＆ 現地写真スタジオ (Editor & Live Preview)
           ===================================================================== */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Island List Column */}
          <div className="lg:col-span-1 bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-col h-[78vh]">
            <div className="flex items-center justify-between text-[11px] text-gray-400 mb-2 px-1">
              <span>該当島リスト ({filteredIslands.length}島)</span>
              <span>クリックで編集</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {isLoading ? (
                <p className="text-center text-gray-500 text-xs py-8">読み込み中...</p>
              ) : filteredIslands.length === 0 ? (
                <p className="text-center text-gray-500 text-xs py-8">条件に一致する島が見つかりません</p>
              ) : (
                filteredIslands.map((island) => {
                  const meta = getVerifiedIslandPhotos(island);
                  return (
                    <div
                      key={island.id}
                      className={`group p-2.5 rounded-xl transition cursor-pointer border flex items-center justify-between ${
                        selectedIsland?.id === island.id
                          ? 'bg-emerald-950/60 border-emerald-500/60 text-white'
                          : 'bg-gray-950/60 border-gray-800/80 text-gray-300 hover:border-gray-700'
                      }`}
                      onClick={() => handleEdit(island)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {meta.hasVerifiedPhoto ? (
                          <img
                            src={meta.desktopUrl || meta.mobileUrl || ''}
                            alt={island.name}
                            className="w-10 h-10 rounded-lg object-cover shrink-0 border border-emerald-500/40"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-800/80 border border-gray-700 flex flex-col items-center justify-center text-gray-500 shrink-0">
                            <Camera className="w-3.5 h-3.5" />
                            <span className="text-[8px]">未登録</span>
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-bold text-xs text-white truncate">{island.name}</h4>
                            {meta.mobileUrl && (
                              <span className="px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-500/40 text-[9px] text-cyan-300 font-bold">
                                縦・横
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-gray-400 truncate">
                            {island.prefecture} / {island.region_id}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <a
                          href={`/island/${island.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 text-gray-500 hover:text-cyan-400 rounded hover:bg-gray-800 transition"
                          title="実際の島ページを開く"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(island);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-500 hover:text-red-400 rounded hover:bg-gray-800 transition"
                          title="削除"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Editor Form Column */}
          <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-6 h-[78vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-5">
              <div className="flex items-center gap-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-emerald-400" />
                  {selectedIsland ? `「${selectedIsland.name}」の編集・現地写真設定` : '新規島データ作成'}
                </h3>
                {selectedIsland && (
                  <a
                    href={`/island/${selectedIsland.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-cyan-400 hover:underline flex items-center gap-1 font-bold"
                  >
                    公開ページを確認 <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              {selectedIsland && (
                <button
                  type="button"
                  onClick={() => handleDelete(selectedIsland)}
                  className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 font-bold bg-red-950/40 border border-red-800/50 px-3 py-1.5 rounded-lg transition"
                >
                  <Trash2 className="w-3.5 h-3.5" /> 削除
                </button>
              )}
            </div>

            <form onSubmit={handleSave} className="space-y-6 text-xs">
              {/* =========================================================
                  📷 現地実写フォトスタジオ（横写真・縦写真・ギャラリー・スマホ見え方調整）
                 ========================================================= */}
              <div className="bg-gray-950/90 p-5 rounded-2xl border border-emerald-500/30 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-800 pb-3">
                  <div>
                    <h4 className="text-sm font-black text-emerald-400 flex items-center gap-2">
                      <Camera className="w-4 h-4" />
                      現地実写フォトスタジオ（PC横写真 ／ スマホ縦写真・スマート切替対応）
                    </h4>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      お手持ちの写真をドロップすると自動でWebP軽量化＆縦横判定を行います。
                    </p>
                  </div>

                  {/* スマート一括ドロップ＆ファイル選択ボタン */}
                  <label
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleSlotUpload(e.dataTransfer.files, 'auto');
                    }}
                    className="cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl font-bold text-xs transition shadow flex items-center gap-1.5 shrink-0"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {uploading ? 'アップロード中...' : '写真を選択 / ドロップ（複数可・縦横自動振分）'}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleSlotUpload(e.target.files, 'auto')}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* 1. 横写真 (PC・共通メイン) & 2. 縦写真 (スマホ専用) の2カラム設定 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* ① 横写真（PC・タブレット・共通メイン） */}
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleSlotUpload(e.dataTransfer.files, 'desktop');
                    }}
                    className="bg-gray-900 border border-gray-800 rounded-xl p-3.5 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-200 flex items-center gap-1.5">
                        <Monitor className="w-3.5 h-3.5 text-emerald-400" />
                        ① 横写真（PC・共通メイン写真）
                      </span>
                      {formData.hero_image_url && (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, hero_image_url: '', thumbnail_url: '' })}
                          className="text-[10px] text-red-400 hover:underline"
                        >
                          クリア
                        </button>
                      )}
                    </div>

                    {formData.hero_image_url ? (
                      <div className="relative w-full aspect-[16/10] rounded-lg overflow-hidden bg-black border border-gray-700">
                        <img
                          src={formData.hero_image_url}
                          alt="PC横写真プレビュー"
                          style={{ objectPosition: formData.photo_focal_point || '50% 50%' }}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-full aspect-[16/10] rounded-lg border border-dashed border-gray-700 bg-gray-950 flex flex-col items-center justify-center text-gray-500 gap-1">
                        <ImageIcon className="w-5 h-5" />
                        <span className="text-[10px]">横写真をここにドロップ</span>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="https://... またはファイルをアップロード"
                        className="flex-1 bg-gray-950 border border-gray-800 rounded-lg px-2.5 py-1.5 text-white text-[11px] font-mono"
                        value={formData.hero_image_url || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            hero_image_url: e.target.value,
                            thumbnail_url: e.target.value,
                          })
                        }
                      />
                      <label className="cursor-pointer bg-gray-800 hover:bg-gray-700 text-gray-200 px-2.5 py-1.5 rounded-lg border border-gray-700 text-[11px] font-bold shrink-0 flex items-center gap-1">
                        <Upload className="w-3 h-3 text-emerald-400" />
                        横写真変更
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleSlotUpload(e.target.files, 'desktop')}
                          disabled={uploading}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* ② 縦写真（スマートフォン専用メイン写真・任意） */}
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleSlotUpload(e.dataTransfer.files, 'mobile');
                    }}
                    className="bg-gray-900 border border-gray-800 rounded-xl p-3.5 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-200 flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                        ② 縦写真（スマホ専用・自動切替用）
                      </span>
                      {formData.hero_image_mobile_url && (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, hero_image_mobile_url: '' })}
                          className="text-[10px] text-red-400 hover:underline"
                        >
                          クリア
                        </button>
                      )}
                    </div>

                    {formData.hero_image_mobile_url ? (
                      <div className="relative w-full aspect-[16/10] rounded-lg overflow-hidden bg-black border border-gray-700 flex items-center justify-center">
                        <img
                          src={formData.hero_image_mobile_url}
                          alt="スマホ縦写真プレビュー"
                          className="h-full object-contain"
                        />
                        <span className="absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded bg-cyan-950/90 text-cyan-300 text-[9px] font-bold border border-cyan-500/30">
                          スマホ表示時に自動適用
                        </span>
                      </div>
                    ) : (
                      <div className="w-full aspect-[16/10] rounded-lg border border-dashed border-gray-700 bg-gray-950 flex flex-col items-center justify-center text-gray-500 gap-1 p-2 text-center">
                        <Smartphone className="w-5 h-5" />
                        <span className="text-[10px]">
                          スマホ用の縦写真がある場合はここにドロップ（未登録時は①の横写真をスマホ最適化枠で表示）
                        </span>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="スマホ専用縦写真URL（任意）"
                        className="flex-1 bg-gray-950 border border-gray-800 rounded-lg px-2.5 py-1.5 text-white text-[11px] font-mono"
                        value={formData.hero_image_mobile_url || ''}
                        onChange={(e) => setFormData({ ...formData, hero_image_mobile_url: e.target.value })}
                      />
                      <label className="cursor-pointer bg-gray-800 hover:bg-gray-700 text-gray-200 px-2.5 py-1.5 rounded-lg border border-gray-700 text-[11px] font-bold shrink-0 flex items-center gap-1">
                        <Upload className="w-3 h-3 text-cyan-400" />
                        縦写真追加
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleSlotUpload(e.target.files, 'mobile')}
                          disabled={uploading}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* 3. スマホでの横写真表示モード & 焦点位置調整 & 実機プレビュー */}
                {(formData.hero_image_url || formData.hero_image_mobile_url) && (
                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <label className="block font-bold text-gray-200">
                          スマホで横写真を表示する際のフレーミング設定
                        </label>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, mobile_display_mode: 'contain_blur' })}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition ${
                              formData.mobile_display_mode !== 'cover'
                                ? 'bg-cyan-600 text-white border-cyan-400'
                                : 'bg-gray-950 text-gray-400 border-gray-800'
                            }`}
                          >
                            ✨ パノラマ全体表示＋背景ぼかし（横写真の左右が切れず見やすい・推奨）
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, mobile_display_mode: 'cover' })}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition ${
                              formData.mobile_display_mode === 'cover'
                                ? 'bg-cyan-600 text-white border-cyan-400'
                                : 'bg-gray-950 text-gray-400 border-gray-800'
                            }`}
                          >
                            焦点位置を中心に枠いっぱいカバー表示
                          </button>
                        </div>
                      </div>

                      {/* プレビュー端末切替 */}
                      <div className="flex bg-gray-950 border border-gray-800 p-1 rounded-lg shrink-0">
                        <button
                          type="button"
                          onClick={() => setPreviewDevice('mobile')}
                          className={`px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1 ${
                            previewDevice === 'mobile' ? 'bg-gray-800 text-cyan-300' : 'text-gray-500'
                          }`}
                        >
                          <Smartphone className="w-3 h-3" /> スマホ見え方確認
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewDevice('desktop')}
                          className={`px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1 ${
                            previewDevice === 'desktop' ? 'bg-gray-800 text-emerald-300' : 'text-gray-500'
                          }`}
                        >
                          <Monitor className="w-3 h-3" /> PC見え方確認
                        </button>
                      </div>
                    </div>

                    {/* 実機プレビュー & クリック焦点ピッカー */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                      <div className="space-y-1.5">
                        <p className="text-[11px] text-gray-400 flex items-center gap-1">
                          <Crosshair className="w-3.5 h-3.5 text-amber-400" />
                          下の写真をクリックすると、切り抜き時の中心点（焦点: <code>{formData.photo_focal_point}</code>）を指定できます
                        </p>
                        <div
                          onClick={handleFocalPointClick}
                          className="relative w-full aspect-[16/10] rounded-xl overflow-hidden border border-gray-700 cursor-crosshair select-none bg-black"
                        >
                          <img
                            src={formData.hero_image_url || formData.hero_image_mobile_url}
                            alt="Focal Picker"
                            className="w-full h-full object-contain"
                          />
                          {(() => {
                            const [fx, fy] = (formData.photo_focal_point || '50% 50%')
                              .split(' ')
                              .map((v) => parseFloat(v) || 50);
                            return (
                              <div
                                style={{ left: `${fx}%`, top: `${fy}%` }}
                                className="absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 border-amber-400 bg-amber-400/30 shadow-lg pointer-events-none flex items-center justify-center"
                              >
                                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                              </div>
                            );
                          })()}
                        </div>
                      </div>

                      {/* スマホ / PC シミュレーション枠 */}
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] font-bold text-gray-400 mb-1.5">
                          {previewDevice === 'mobile'
                            ? formData.hero_image_mobile_url
                              ? '📱 スマホ表示プレビュー（縦写真に自動切替）'
                              : formData.mobile_display_mode === 'cover'
                                ? '📱 スマホ表示プレビュー（焦点カバー）'
                                : '📱 スマホ表示プレビュー（パノラマ全体表示）'
                            : '💻 PC表示プレビュー'}
                        </span>

                        {previewDevice === 'mobile' ? (
                          <div className="w-56 rounded-2xl border-2 border-gray-700 bg-slate-950 overflow-hidden shadow-xl">
                            {formData.hero_image_mobile_url ? (
                              <div className="relative h-44 w-full overflow-hidden">
                                <img
                                  src={formData.hero_image_mobile_url}
                                  alt="Mobile Portrait Preview"
                                  style={{ objectPosition: formData.photo_focal_point }}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-900">
                                <img
                                  src={formData.hero_image_url}
                                  alt=""
                                  className="absolute inset-0 w-full h-full object-cover blur-md scale-110 opacity-45"
                                />
                                <img
                                  src={formData.hero_image_url}
                                  alt="Mobile Landscape Preview"
                                  style={{ objectPosition: formData.photo_focal_point }}
                                  className={`relative z-10 w-full h-full ${
                                    formData.mobile_display_mode === 'cover' ? 'object-cover' : 'object-contain'
                                  }`}
                                />
                              </div>
                            )}
                            <div className="p-2.5 bg-slate-900 text-white">
                              <p className="text-[9px] text-cyan-300 font-bold">{formData.prefecture}</p>
                              <p className="font-serif font-bold text-sm">{formData.name || '島名'}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="w-full aspect-[16/9] rounded-xl border-2 border-gray-700 bg-slate-950 overflow-hidden relative shadow-xl">
                            <img
                              src={formData.hero_image_url || formData.hero_image_mobile_url}
                              alt="Desktop Preview"
                              style={{ objectPosition: formData.photo_focal_point }}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                            <div className="absolute bottom-3 left-4 text-white">
                              <p className="text-[9px] text-cyan-300 font-bold">{formData.prefecture}</p>
                              <p className="font-serif font-bold text-lg">{formData.name || '島名'}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. 追加ギャラリー写真一覧（複数枚登録・削除） */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-gray-300 font-bold">
                      ③ 現地ギャラリー写真一覧 ({(formData.gallery_urls || []).length}枚)
                    </label>
                    <label className="cursor-pointer text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1">
                      <Plus className="w-3.5 h-3.5" /> ギャラリー写真を追加
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleSlotUpload(e.target.files, 'gallery')}
                        disabled={uploading}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {formData.gallery_urls && formData.gallery_urls.length > 0 && (
                    <div className="flex flex-wrap gap-2.5 pt-1">
                      {formData.gallery_urls.map((gUrl, idx) => (
                        <div
                          key={gUrl + idx}
                          className="relative w-20 h-14 rounded-lg overflow-hidden border border-gray-700 group/g"
                        >
                          <img src={gUrl} alt="" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                gallery_urls: (prev.gallery_urls || []).filter((_, i) => i !== idx),
                              }))
                            }
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/80 text-red-400 flex items-center justify-center opacity-0 group-hover/g:opacity-100 transition"
                            title="この写真を削除"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 基本マスター情報フォーム */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 mb-1 font-bold">島ID / スラッグ (必須)</label>
                  <input
                    required
                    type="text"
                    placeholder="例: ishigaki"
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-emerald-500"
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    disabled={!!selectedIsland}
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1 font-bold">島名 (必須)</label>
                  <input
                    required
                    type="text"
                    placeholder="例: 石垣島"
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1 font-bold">都道府県</label>
                  <input
                    required
                    type="text"
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                    value={formData.prefecture}
                    onChange={(e) => setFormData({ ...formData, prefecture: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1 font-bold">地域ID (region_id)</label>
                  <input
                    required
                    type="text"
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                    value={formData.region_id}
                    onChange={(e) => setFormData({ ...formData, region_id: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1 font-bold">中心座標 (緯度, 経度)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 bg-gray-950 border border-gray-800 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-emerald-500"
                      value={formData.coordinates}
                      onChange={(e) => setFormData({ ...formData, coordinates: e.target.value })}
                      placeholder="24.3406, 124.1561"
                    />
                    <button
                      type="button"
                      onClick={() => setShowMapModal(true)}
                      className="px-3 bg-emerald-950 border border-emerald-600 text-emerald-300 hover:bg-emerald-900 rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0"
                    >
                      <MapPin className="w-3.5 h-3.5" /> 座標設定
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-gray-400 mb-1 font-bold">チェックイン判定半径 (m)</label>
                  <input
                    type="number"
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                    value={formData.checkin_radius_m}
                    onChange={(e) => setFormData({ ...formData, checkin_radius_m: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1 font-bold">到達難易度</label>
                  <select
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                  >
                    <option value="初級">初級 (アクセス容易)</option>
                    <option value="中級">中級</option>
                    <option value="上級">上級 (定期船僅か・秘境)</option>
                    <option value="超上級">超上級 (チャーター要・難関)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 mb-1 font-bold">到達ポイント</label>
                  <input
                    type="number"
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                    value={formData.points}
                    onChange={(e) => setFormData({ ...formData, points: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 mb-1 font-bold">島の解説・魅力文</label>
                <textarea
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500 h-24"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-1 font-bold">アクセス・フェリー情報</label>
                <textarea
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500 h-20"
                  value={formData.access}
                  onChange={(e) => setFormData({ ...formData, access: e.target.value })}
                />
              </div>

              <div className="pt-3 border-t border-gray-800 flex justify-end">
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-8 py-3 rounded-xl transition shadow active:scale-95 flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" /> 島データ・現地写真を保存する
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Interactive Map Coordinates Modal */}
      {showMapModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-xl w-full p-6 text-white space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                <MapPin className="w-5 h-5" /> 緯度・経度の入力設定アシスト
              </h3>
              <button onClick={() => setShowMapModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-400">
              対象の島の中央座標を入力してください。（形式: <code>24.3406, 124.1561</code>）
            </p>
            <div className="space-y-3">
              <input
                type="text"
                value={formData.coordinates}
                onChange={(e) => setFormData({ ...formData, coordinates: e.target.value })}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-sm font-mono text-white"
                placeholder="24.3406, 124.1561"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowMapModal(false)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2 rounded-xl text-xs"
              >
                決定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
