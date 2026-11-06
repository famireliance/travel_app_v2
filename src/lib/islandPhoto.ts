/**
 * KIRATABI Authentic Local Photo Resolver
 * ----------------------------------------
 * 「絶対に現地以外の写真を使用しない」ポリシーをシステム全体で強制するためのユーティリティ。
 * - 汎用ストック画像（/region/*, /regions/*, /places/*, unsplash.com 等）は一切使用しない。
 * - 管理画面から登録された現地実写写真、またはオーナー撮影の検証済み現地写真のみを返却する。
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
  /** 検証済み現地写真が存在するかどうか */
  hasVerifiedPhoto: boolean;
}

/**
 * オーナー撮影の検証済み現地写真（/hero/slide*.webp）と、実際の撮影島IDの厳格な1対1マッピング。
 * ※ 該当する島以外には絶対に使用しない。
 */
const OWNER_VERIFIED_ISLAND_PHOTOS: Record<string, { desktop: string; gallery: string[]; caption: string }> = {
  // 西表島 (ID: 396)
  '396': {
    desktop: '/hero/slide2.webp',
    gallery: ['/hero/slide2.webp'],
    caption: '西表島（沖縄県八重山郡竹富町）現地実写',
  },
  // 父島・小笠原諸島 (ID: 63)
  '63': {
    desktop: '/hero/slide3.webp',
    gallery: [
      '/hero/slide3.webp',
      '/hero/slide4.webp',
      '/hero/slide5.webp',
      '/hero/slide11.webp',
      '/hero/slide13.webp',
      '/hero/slide17.webp',
    ],
    caption: '小笠原諸島（東京都小笠原村）現地実写',
  },
  // 粟国島 (ID: 382)
  '382': {
    desktop: '/hero/slide10.webp',
    gallery: ['/hero/slide10.webp'],
    caption: '粟国島（沖縄県島尻郡粟国村）現地実写',
  },
  // 宮古島 (ID: 386)
  '386': {
    desktop: '/hero/slide14.webp',
    gallery: [
      '/hero/slide14.webp',
      '/hero/slide9.webp',
      '/hero/slide12.webp',
      '/hero/slide15.webp',
      '/hero/slide16.webp',
      '/hero/slide18.webp',
      '/hero/slide19.webp',
    ],
    caption: '宮古島（沖縄県宮古島市）現地実写',
  },
  // 与那国島 (ID: 401)
  '401': {
    desktop: '/hero/slide6.webp',
    gallery: ['/hero/slide6.webp', '/hero/slide7.webp', '/hero/slide8.webp'],
    caption: '与那国島（沖縄県八重山郡与那国町）現地実写',
  },
};

/**
 * URLが汎用ストック画像・自動収集画像・ダミー画像でないかを厳格に判定する。
 */
export function isAuthenticLocalPhotoUrl(url: unknown): url is string {
  if (typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;

  // 過去の汎用地域画像・自動スクレイピング画像・外部フリー素材はすべて拒否
  const forbiddenPatterns = [
    '/region/',
    '/regions/',
    '/places/',
    'images.unsplash.com',
    'unsplash.com',
    'placeholder',
    '/og-image.png',
    'default',
  ];

  for (const pattern of forbiddenPatterns) {
    if (trimmed.includes(pattern)) {
      return false;
    }
  }

  // Supabase Storage アップロード画像、DataURL、または /hero/ 内の検証済み画像等を許可
  return (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('/hero/') ||
    trimmed.startsWith('/uploads/')
  );
}

/**
 * 島オブジェクトから検証済み現地写真メタデータを抽出する。
 * 現地写真が未登録の場合は desktopUrl: null, hasVerifiedPhoto: false を返し、
 * 他の島や汎用ストック写真をフォールバックとして返すことは絶対にしない。
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
      hasVerifiedPhoto: false,
    };
  }

  const idStr = String(island.id || '');
  const practical =
    island.practical_info && typeof island.practical_info === 'object'
      ? island.practical_info
      : {};

  // 1. 管理画面から設定されたメイン横写真 (hero_image_url / thumbnail_url)
  const rawHero = island.hero_image_url || practical.hero_image_url || island.thumbnail_url || '';
  const validAdminDesktop = isAuthenticLocalPhotoUrl(rawHero) ? rawHero.trim() : null;

  // 2. 管理画面から設定されたスマホ用縦写真 (practical_info.hero_image_mobile_url)
  const rawMobile = island.hero_image_mobile_url || practical.hero_image_mobile_url || '';
  const validAdminMobile = isAuthenticLocalPhotoUrl(rawMobile) ? rawMobile.trim() : null;

  // 3. 管理画面から設定されたギャラリー写真配列 (practical_info.gallery_urls)
  const rawGallery: unknown[] = Array.isArray(practical.gallery_urls)
    ? practical.gallery_urls
    : Array.isArray(island.gallery_urls)
      ? island.gallery_urls
      : [];
  const validAdminGallery = rawGallery.filter(isAuthenticLocalPhotoUrl);

  // 4. オーナー検証済み初期写真（該当する5島のみ）
  const ownerPreset = OWNER_VERIFIED_ISLAND_PHOTOS[idStr];

  const desktopUrl = validAdminDesktop || validAdminMobile || ownerPreset?.desktop || null;
  const mobileUrl = validAdminMobile || null;

  // ギャラリー一覧の構築（重複排除）
  const gallerySet = new Set<string>();
  if (validAdminDesktop) gallerySet.add(validAdminDesktop);
  if (validAdminMobile) gallerySet.add(validAdminMobile);
  for (const gUrl of validAdminGallery) {
    gallerySet.add(gUrl);
  }
  if (gallerySet.size === 0 && ownerPreset) {
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
    typeof practical.photo_caption === 'string' && practical.photo_caption.trim() !== ''
      ? practical.photo_caption.trim()
      : ownerPreset?.caption;

  return {
    desktopUrl,
    mobileUrl,
    galleryUrls: Array.from(gallerySet),
    mobileDisplayMode,
    focalPoint,
    caption,
    hasVerifiedPhoto: Boolean(desktopUrl || mobileUrl),
  };
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
