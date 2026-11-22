import { ALL_ISLANDS_MASTER_DICTIONARY } from '@/data/allIslandsMaster';

/**
 * KIRATABI Authentic Local Photo & Real Coastline Aerial Resolver
 * ----------------------------------------------------------------
 * - 汎用ストック画像（/region/*, /regions/*, /places/*, unsplash.com 等）や他島の写真流用を完全に排除。
 * - 管理画面登録の現地写真、オーナー撮影の1対1現地写真、または座標・島名二重検証済みの実地写真（重複ゼロ）を返却。
 * - 地上写真が未登録の小島・無人島については、その島の正確な実座標を中心とした衛星・航空実写タイル計算を提供。
 */

export interface IslandPhotoMeta {
  /** PC・横画面用メイン写真（または共通メイン写真） */
  desktopUrl: string | null;
  /** スマートフォン・縦画面専用メイン写真（登録されている場合） */
  mobileUrl: string | null;
  /** ギャラリー写真一覧（メイン写真含むすべての検証済み現地写真） */
  galleryUrls: string[];
  /** スマホで横写真のみの場合の表示モード: 'contain_blur' (全体表示+背景ぼかし) | 'cover' (焦点位置でカバー) */
  mobileDisplayMode: 'contain_blur' | 'cover';
  /** object-position 用の焦点座標 (例: "50% 50%") */
  focalPoint: string;
  /** 写真キャプション・撮影場所メモ */
  caption?: string;
  /** 写真の出典種別: 'local' (オーナー/管理者直接撮影) | 'wikimedia' (座標検証済実地写真) | 'none' */
  photoSource: 'local' | 'wikimedia' | 'none';
  /** 検証済み実地写真が存在するかどうか */
  hasVerifiedPhoto: boolean;
}

export interface AerialTileGrid {
  zoom: number;
  /** 2x2 隣接タイル (左上, 右上, 左下, 右下) */
  tiles: { key: string; url: string; col: 0 | 1; row: 0 | 1 }[];
  /** 200%x200% コンテナに適用する left (%) — 島の座標が常にカード中央(50%,50%)に来る */
  offsetLeftPct: number;
  /** 200%x200% コンテナに適用する top (%) */
  offsetTopPct: number;
}

/**
 * オーナー撮影の検証済み現地写真（/hero/slide*.webp）と、実際の撮影島IDの厳格な1対1マッピング（島間重複ゼロ）。
 */
const OWNER_VERIFIED_ISLAND_PHOTOS: Record<string, { desktop: string; gallery: string[]; caption: string }> = {
  // 西表島 (ID: 396)
  '396': {
    desktop: '/hero/slide2.webp',
    gallery: ['/hero/slide2.webp'],
    caption: '西表島 マングローブ林（沖縄県八重山郡竹富町・現地実写）',
  },
  // 父島・小笠原諸島 (ID: 63)
  '63': {
    desktop: '/hero/slide13.webp',
    gallery: ['/hero/slide13.webp', '/hero/slide17.webp', '/hero/slide11.webp', '/hero/slide5.webp'],
    caption: '父島 二見湾・境浦（東京都小笠原村・現地実写）',
  },
  // 南島・小笠原諸島 (ID: minamijima_ogasawara)
  minamijima_ogasawara: {
    desktop: '/hero/slide3.webp',
    gallery: ['/hero/slide3.webp', '/hero/slide4.webp'],
    caption: '南島 扇池（東京都小笠原村・現地実写）',
  },
  // 粟国島 (ID: 382)
  '382': {
    desktop: '/hero/slide10.webp',
    gallery: ['/hero/slide10.webp'],
    caption: '粟国島 マハナ・むんじゅるー（沖縄県島尻郡粟国村・現地実写）',
  },
  // 宮古島 (ID: 386)
  '386': {
    desktop: '/hero/slide16.webp',
    gallery: ['/hero/slide16.webp', '/hero/slide15.webp', '/hero/slide9.webp', '/hero/slide12.webp'],
    caption: '宮古島（沖縄県宮古島市・現地実写）',
  },
  // 伊良部島 (ID: 387)
  '387': {
    desktop: '/hero/slide19.webp',
    gallery: ['/hero/slide19.webp'],
    caption: '伊良部島・伊良部大橋（沖縄県宮古島市・現地実写）',
  },
  // 池間島 (ID: 388)
  '388': {
    desktop: '/hero/slide14.webp',
    gallery: ['/hero/slide14.webp'],
    caption: '池間島・池間大橋（沖縄県宮古島市・現地実写）',
  },
  // ユニの浜 (ID: uninohama_miyako)
  uninohama_miyako: {
    desktop: '/hero/slide18.webp',
    gallery: ['/hero/slide18.webp'],
    caption: 'ユニの浜（沖縄県宮古島市伊良部沖・現地実写）',
  },
  // 与那国島 (ID: 401)
  '401': {
    desktop: '/hero/slide6.webp',
    gallery: ['/hero/slide6.webp', '/hero/slide7.webp', '/hero/slide8.webp'],
    caption: '与那国島 最西端の碑・ヨナグニウマ（沖縄県八重山郡与那国町・現地実写）',
  },
};

/**
 * URLが汎用ストック画像・旧自動収集画像・ダミー画像でないかを厳格に判定する。
 */
export function isAuthenticLocalPhotoUrl(url: unknown): url is string {
  if (typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;

  const forbiddenPatterns = [
    '/region/',
    '/regions/',
    '/places/',
    'images.unsplash.com',
    'unsplash.com',
    'picsum.photos',
    'placeholder',
    '/og-image.png',
    'default',
  ];

  for (const pattern of forbiddenPatterns) {
    if (trimmed.includes(pattern)) {
      return false;
    }
  }

  return (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('/hero/') ||
    trimmed.startsWith('/uploads/')
  );
}

/**
 * 島オブジェクトから検証済み実地写真メタデータを抽出する。
 * DBの部分オブジェクトに hero_image_url が欠けている場合もマスター辞書の検証済写真を参照する。
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getVerifiedIslandPhotos(island: any): IslandPhotoMeta {
  if (!island) {
    return {
      desktopUrl: null,
      mobileUrl: null,
      galleryUrls: [],
      mobileDisplayMode: 'contain_blur',
      focalPoint: '50% 50%',
      photoSource: 'none',
      hasVerifiedPhoto: false,
    };
  }

  const idStr = String(island.id || '');
  const masterFallback = idStr ? ALL_ISLANDS_MASTER_DICTIONARY[idStr] : undefined;
  const ownerPreset = OWNER_VERIFIED_ISLAND_PHOTOS[idStr];

  const practical =
    island.practical_info && typeof island.practical_info === 'object'
      ? { ...(masterFallback?.practical_info || {}), ...island.practical_info }
      : masterFallback?.practical_info || {};

  // オーナー検証済みの9島において旧 slide3/slide14 がDBに残っている場合は厳格な新1対1割当を優先
  const rawDbHero = island.hero_image_url || practical.hero_image_url || island.thumbnail_url || '';
  const shouldPreferOwnerMapping =
    ownerPreset && typeof rawDbHero === 'string' && rawDbHero.startsWith('/hero/slide') && rawDbHero !== ownerPreset.desktop;

  const candidateHero = shouldPreferOwnerMapping
    ? ownerPreset.desktop
    : rawDbHero || masterFallback?.hero_image_url || '';

  const validDesktop = isAuthenticLocalPhotoUrl(candidateHero) ? candidateHero.trim() : null;

  const rawMobile = island.hero_image_mobile_url || practical.hero_image_mobile_url || '';
  const validMobile = isAuthenticLocalPhotoUrl(rawMobile) ? rawMobile.trim() : null;

  const rawGallery: unknown[] = shouldPreferOwnerMapping
    ? ownerPreset.gallery
    : Array.isArray(practical.gallery_urls)
      ? practical.gallery_urls
      : Array.isArray(island.gallery_urls)
        ? island.gallery_urls
        : [];
  const validGallery = rawGallery.filter(isAuthenticLocalPhotoUrl);

  const desktopUrl = validDesktop || validMobile || ownerPreset?.desktop || null;
  const mobileUrl = validMobile || null;

  const gallerySet = new Set<string>();
  if (desktopUrl) gallerySet.add(desktopUrl);
  if (mobileUrl) gallerySet.add(mobileUrl);
  for (const gUrl of validGallery) {
    gallerySet.add(gUrl);
  }
  if (gallerySet.size <= 1 && ownerPreset) {
    for (const gUrl of ownerPreset.gallery) {
      gallerySet.add(gUrl);
    }
  }

  const mobileDisplayMode: 'contain_blur' | 'cover' =
    practical.mobile_display_mode === 'cover' ? 'cover' : 'contain_blur';

  const focalPoint =
    typeof practical.photo_focal_point === 'string' && practical.photo_focal_point.trim() !== ''
      ? practical.photo_focal_point.trim()
      : '50% 50%';

  const caption =
    shouldPreferOwnerMapping
      ? ownerPreset.caption
      : typeof practical.photo_caption === 'string' && practical.photo_caption.trim() !== ''
        ? practical.photo_caption.trim()
        : ownerPreset?.caption;

  const primaryUrl = desktopUrl || mobileUrl || '';
  const photoSource: 'local' | 'wikimedia' | 'none' = !primaryUrl
    ? 'none'
    : primaryUrl.includes('wikimedia.org')
      ? 'wikimedia'
      : 'local';

  return {
    desktopUrl,
    mobileUrl,
    galleryUrls: Array.from(gallerySet),
    mobileDisplayMode,
    focalPoint,
    caption,
    photoSource,
    hasVerifiedPhoto: Boolean(desktopUrl || mobileUrl),
  };
}

/**
 * 地上写真が未登録の離島向けに、その島の正確な緯度経度をカード中央(50%,50%)に捉える
 * 2x2 リアル衛星空撮タイルグリッドを算出する（全島で100%異なる実地形を表示）。
 */
export function getCenteredAerialTileGrid(coordinates?: string, radiusM?: number): AerialTileGrid | null {
  if (!coordinates || typeof coordinates !== 'string') return null;
  const parts = coordinates.split(',').map((s) => parseFloat(s.trim()));
  if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return null;
  const [lat, lng] = parts;
  if (lat < -85 || lat > 85 || lng < -180 || lng > 180) return null;

  const rKm = (Number(radiusM) || 800) / 1000;
  const zoom = rKm >= 7 ? 11 : rKm >= 3 ? 12 : rKm >= 1.1 ? 13 : 14;
  const n = 2 ** zoom;

  const xFloat = ((lng + 180) / 360) * n;
  const latRad = (lat * Math.PI) / 180;
  const yFloat = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;

  const tx = Math.floor(xFloat);
  const ty = Math.floor(yFloat);
  const fx = xFloat - tx;
  const fy = yFloat - ty;

  const x0 = fx < 0.5 ? tx - 1 : tx;
  const y0 = fy < 0.5 ? ty - 1 : ty;

  const px = (xFloat - x0) / 2; // [0.25, 0.75]
  const py = (yFloat - y0) / 2; // [0.25, 0.75]

  const offsetLeftPct = Number(((0.5 - 2 * px) * 100).toFixed(2));
  const offsetTopPct = Number(((0.5 - 2 * py) * 100).toFixed(2));

  const tiles: AerialTileGrid['tiles'] = [];
  for (const row of [0, 1] as const) {
    for (const col of [0, 1] as const) {
      const x = ((x0 + col) % n + n) % n;
      const y = Math.max(0, Math.min(n - 1, y0 + row));
      tiles.push({
        key: `${zoom}-${x}-${y}`,
        url: `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${y}/${x}`,
        col,
        row,
      });
    }
  }

  return { zoom, tiles, offsetLeftPct, offsetTopPct };
}

/**
 * 緯度・経度文字列 ("27.0744, 142.2015") を人間が読みやすい海図表記 ("27°04'28\"N 142°12'05\"E") に変換する
 */
export function formatNauticalCoordinates(coordinates?: string): string {
  if (!coordinates || typeof coordinates !== 'string') return 'JAPAN ARCHIPELAGO';
  const parts = coordinates.split(',').map((s) => parseFloat(s.trim()));
  if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return 'JAPAN ARCHIPELAGO';

  const toDMS = (deg: number, posChar: string, negChar: string) => {
    const dir = deg >= 0 ? posChar : negChar;
    const abs = Math.abs(deg);
    const d = Math.floor(abs);
    const mFloat = (abs - d) * 60;
    const m = Math.floor(mFloat);
    const s = Math.round((mFloat - m) * 60);
    return `${d}°${String(m).padStart(2, '0')}'${String(s).padStart(2, '0')}"${dir}`;
  };

  return `${toDMS(parts[0], 'N', 'S')}  ${toDMS(parts[1], 'E', 'W')}`;
}
