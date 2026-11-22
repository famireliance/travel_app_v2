import { createClient } from '@supabase/supabase-js';
import { ALL_ISLANDS_MASTER_DICTIONARY } from '@/data/allIslandsMaster';
import {
  getIslandFacilityDataOrDefault,
  getRakutenTravelSearchUrl,
  getJalanSearchUrl,
  getRakutenRentacarSearchUrl,
  getJalanRentacarSearchUrl,
} from '@/data/islandFacilitiesData';
import { AFFILIATE_PRODUCTS } from '@/data/affiliateProducts';
import { getFallbackJson } from '@/lib/adminConfigFallback';

export interface ConciergePartnerItem {
  id: string;
  kind: 'official_stay' | 'sponsor_partner';
  badge: string;
  name: string;
  category: string;
  perkText?: string;
  priceRange?: string;
  url: string;
  isInternal: boolean;
}

export interface ConciergeLinkItem {
  label: string;
  url: string;
  provider: 'rakuten' | 'jalan' | 'custom' | 'amazon' | 'official';
  isInternal?: boolean;
}

export interface ConciergeGearPick {
  name: string;
  icon: string;
  reason: string;
  rakutenUrl?: string;
  amazonUrl?: string;
}

export interface IslandConciergeGuide {
  islandId: string;
  islandName: string;
  prefecture: string;
  partners: ConciergePartnerItem[];
  stayTip: string;
  localStayNames: string[];
  stayLinks: ConciergeLinkItem[];
  needsRentacar: boolean;
  mobilityTip: string;
  localTransportNames: string[];
  mobilityLinks: ConciergeLinkItem[];
}

export interface PlanGearSummary {
  gearPicks: ConciergeGearPick[];
}

// 島内でレンタカー手配が特に有効な中〜大規模離島・架橋離島IDセット
const CAR_RECOMMENDED_ISLAND_IDS = new Set([
  '2',   // 利尻島
  '49',  // 伊豆大島
  '53',  // 神津島
  '55',  // 三宅島
  '56',  // 八丈島
  '58',  // 青ヶ島
  '63',  // 父島
  '76',  // 佐渡島
  '114', // 淡路島
  '137', // 隠岐・島後
  '155', // 周防大島
  '197', // 小豆島
  '269', // 対馬
  '275', // 壱岐島
  '292', // 中通島
  '296', // 福江島
  '339', // 種子島
  '340', // 屋久島
  '352', // 奄美大島
  '356', // 徳之島
  '357', // 沖永良部島
  '358', // 与論島
  '375', // 久米島
  '386', // 宮古島
  '387', // 池間島
  '388', // 来間島
  '389', // 伊良部島
  '390', // 下地島
  '392', // 石垣島
  '396', // 西表島
  '401', // 与那国島
  'oujima_nanjo',
  'oujima_nago',
  'sesokojima',
  'kourijima',
  'yagajishima',
  'hamahigajima',
  'miyagijima_uruma',
  'ikeijima',
]);

// 徒歩・レンタサイクル・バス中心のコンパクト人気離島ごとの具体的な宿＆移動アドバイス
const ISLAND_SPECIFIC_STAY_TIPS: Record<string, { stayTip: string; mobilityTip: string }> = {
  '376': {
    stayTip: '古座間味ビーチ・阿真ビーチ双方へ動きやすい「座間味集落（港徒歩圏）」のペンション・民宿が最適。朝便利用なら那覇・泊港周辺での前泊も便利です。',
    mobilityTip: 'コンパクトな島のため、港前のレンタサイクル・電動バイクや村営バス（ビーチ直行・片道300円）が快適。那覇本島観光も兼ねる場合は那覇発レンタカーを予約しましょう。',
  },
  '377': {
    stayTip: '渡嘉志久ビーチや阿波連ビーチ近くのペンション・リゾート宿が人気。ハイシーズンは早期予約が必須です。',
    mobilityTip: '港から各ビーチへ乗合バス・送迎車があり、島内散策にはレンタサイクル・レンタルバイクが便利です。',
  },
  '393': {
    stayTip: '日帰り客が帰った後の静かな赤瓦集落と満天の星空を独占できる島内民宿・ラグジュアリーリゾート泊が格別です。',
    mobilityTip: '白砂の集落道のためレンタカーは不要。竹富港から送迎付きのレンタサイクルや水牛車でゆったり巡れます（拠点・石垣島側ではレンタカー推奨）。',
  },
  '392': {
    stayTip: '竹富・西表など周辺離島へ渡るなら「石垣港離島ターミナル徒歩圏」のホテル、海絶景重視なら「川平・フサキ・北部エリア」のリゾートが最適です。',
    mobilityTip: '島が広く川平湾や北部ビーチ巡りには「新石垣空港発着のレンタカー」の事前予約がほぼ必須です。',
  },
  '386': {
    stayTip: '与那覇前浜・シギラ周辺のリゾートホテル、または飲食店の多い平良（市街地）エリアのホテルが拠点に便利です。',
    mobilityTip: '伊良部大橋・池間大橋・来間大橋を渡る絶景ドライブが醍醐味のため、「宮古空港／下地島空港発着のレンタカー」予約が必須です。',
  },
  '195': {
    stayTip: 'ベネッセハウス周辺や本村・宮ノ浦エリアのゲストハウス・古民家宿が人気（高松港・宇野港周辺ホテルでの前後泊もおすすめ）。',
    mobilityTip: '宮ノ浦港前の「電動アシスト自転車」の事前予約が一番人気です。町営バスも100円〜200円で主要美術館を結んでいます。',
  },
  '56': {
    stayTip: '空港やスーパーに近い「三根・底土エリア」のホテル・民宿が拠点に最適。絶景露天風呂めぐりも満喫できます。',
    mobilityTip: '八丈富士や裏見ヶ滝温泉・みはらしの湯を巡るには坂道が多いため、八丈島空港発着のレンタカー手配が必須です。',
  },
  '58': {
    stayTip: '本村（岡部地区）にアットホームな民宿が点在。船・ヘリの座席確保とセットで早めに宿を確保しましょう。',
    mobilityTip: '外輪山と二重カルデラ（ひんぎゃ）の間は急坂が続くため、島内レンタカーの事前予約が強く推奨されます。',
  },
  '340': {
    stayTip: '縄文杉・白谷雲水峡の登山口アクセスに合わせて「宮之浦エリア」または「安房エリア」の宿・ホテルを選ぶのが鉄則です。',
    mobilityTip: '島の外周は約100kmあり路線バス本数が限られるため、屋久島空港または宮之浦港でのレンタカー手配がベストです。',
  },
};

function parseSafeJsonArray(val: unknown): Array<{ title?: string; name?: string; url?: string }> {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function isSafeExternalUrl(url: unknown): url is string {
  return typeof url === 'string' && /^https?:\/\//i.test(url.trim());
}

function normalizeIslandMatchKeys(islandId: string): Set<string> {
  const keys = new Set<string>();
  const idStr = String(islandId || '').trim();
  if (!idStr) return keys;
  keys.add(idStr.toLowerCase());

  const master = ALL_ISLANDS_MASTER_DICTIONARY[idStr];
  if (master) {
    keys.add(String(master.id).toLowerCase());
    if (master.slug) {
      keys.add(master.slug.toLowerCase());
      keys.add(master.slug.toLowerCase().replace(/jima$|to$|shima$/, ''));
    }
    if (master.name) {
      const rawName = master.name.toLowerCase();
      const cleanName = master.name.split('（')[0].split('(')[0].replace(/^.*・/, '').trim().toLowerCase();
      keys.add(rawName);
      if (cleanName) {
        keys.add(cleanName);
        keys.add(cleanName.replace(/島$/, ''));
      }
    }
  }
  return keys;
}

async function withFastTimeout<T>(promise: PromiseLike<T>, ms: number, fallback: T): Promise<T> {
  let timer: NodeJS.Timeout | null = null;
  try {
    return await Promise.race([
      Promise.resolve(promise),
      new Promise<T>((resolve) => {
        timer = setTimeout(() => resolve(fallback), ms);
      }),
    ]);
  } catch {
    return fallback;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

interface LivePartnerCatalog {
  accommodations: any[];
  b2bPartners: any[];
  dbIslandsById: Map<string, any>;
}

async function fetchLivePartnerCatalog(targetIslandIds: string[]): Promise<LivePartnerCatalog> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey || serviceKey.startsWith('REPLACE') || targetIslandIds.length === 0) {
    return { accommodations: [], b2bPartners: [], dbIslandsById: new Map() };
  }

  const client = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const [accRes, partnersDbRes, fallbackPartners, islandsRes] = await Promise.all([
    withFastTimeout<any>(
      client
        .from('accommodations')
        .select('id, island_id, name, price_range, plan_tier, has_pickup, is_verified')
        .eq('is_verified', true),
      1200,
      { data: [] }
    ),
    withFastTimeout<any>(
      client.from('b2b_partners').select('*').eq('is_active', true),
      1200,
      { data: null }
    ),
    withFastTimeout(getFallbackJson<any[]>('fallback_b2b_partners', []), 1200, []),
    withFastTimeout<any>(
      client
        .from('islands')
        .select('id, aff_hotel_url, aff_rentacar_url, aff_ferry_url')
        .in('id', targetIslandIds),
      1200,
      { data: [] }
    ),
  ]);

  const validAccommodations = (accRes.data || []).filter((a: any) => {
    const n = String(a?.name || '');
    return a?.is_verified === true && !n.includes('架空') && !n.includes('テスト用');
  });

  const todayIso = new Date().toISOString().slice(0, 10);
  const rawPartners = Array.isArray(partnersDbRes.data)
    ? partnersDbRes.data
    : Array.isArray(fallbackPartners)
      ? fallbackPartners
      : [];
  const activePartners = rawPartners.filter((p: any) => {
    if (!p || p.is_active === false) return false;
    if (p.contract_end && String(p.contract_end) < todayIso) return false;
    return Boolean(p.name);
  });

  const dbIslandsById = new Map<string, any>();
  for (const row of islandsRes.data || []) {
    dbIslandsById.set(String(row.id), row);
  }

  return {
    accommodations: validAccommodations,
    b2bPartners: activePartners,
    dbIslandsById,
  };
}

export function pickRelevantGearForContext(contextText: string): ConciergeGearPick[] {
  const q = String(contextText || '');
  const picks: ConciergeGearPick[] = [];
  const addById = (id: string) => {
    const found = AFFILIATE_PRODUCTS.find((p) => p.id === id && p.hasAffiliateLink);
    if (found && !picks.some((x) => x.name === found.name)) {
      picks.push({
        name: found.name,
        icon: found.icon,
        reason: found.subtitle,
        rakutenUrl: found.rakutenUrl,
        amazonUrl: found.amazonUrl,
      });
    }
  };

  if (/ウミガメ|シュノーケル|ダイビング|透明度|サンゴ|ビーチ|海水浴|ブルー/.test(q)) {
    addById('snorkel_set');
    addById('waterproof_case');
  }
  if (/高速船|フェリー|ジェット|船|マリンライナー|おがさわら丸|欠航|波/.test(q)) {
    addById('motion_sickness_medicine');
  }
  if (/星空|天体|南十字星|夜空/.test(q)) {
    addById('star_tripod');
  }
  if (/登山|トレッキング|縄文杉|ジャングル|秘境/.test(q)) {
    addById('packable_backpack');
  }
  if (picks.length === 0) {
    addById('motion_sickness_medicine');
    addById('power_bank');
  }

  return picks.slice(0, 2);
}

function buildIslandConciergeGuide(
  islandId: string,
  catalog: LivePartnerCatalog,
  aiStayHint?: string
): IslandConciergeGuide | null {
  const master = ALL_ISLANDS_MASTER_DICTIONARY[String(islandId)];
  if (!master) return null;

  const idStr = String(master.id);
  const islandName = master.name;
  const cleanIslandName = islandName.split('（')[0].split('(')[0].replace(/^.*・/, '').trim() || islandName;
  const prefecture = master.prefecture || '';
  const matchKeys = normalizeIslandMatchKeys(idStr);

  // 1. KIRATABI 公認加盟店・提携宿（将来管理画面で追加された施設がコード改修ゼロで最優先表示される）
  const partners: ConciergePartnerItem[] = [];

  const tierRank: Record<string, number> = { paid_premium: 3, paid_standard: 2, free: 1 };
  const matchedStays = catalog.accommodations
    .filter((a) => matchKeys.has(String(a.island_id || '').toLowerCase()))
    .sort((a, b) => (tierRank[b.plan_tier] || 0) - (tierRank[a.plan_tier] || 0));

  for (const stay of matchedStays.slice(0, 2)) {
    partners.push({
      id: String(stay.id),
      kind: 'official_stay',
      badge: stay.plan_tier === 'paid_premium' ? 'KIRATABI特別公認宿' : 'KIRATABI提携宿',
      name: stay.name,
      category: '宿泊施設（直予約対応）',
      perkText: stay.has_pickup ? '港・空港送迎対応あり' : undefined,
      priceRange: stay.price_range || undefined,
      url: `/stay/${stay.id}`,
      isInternal: true,
    });
  }

  const sponsorRank: Record<string, number> = { GOLD: 3, SILVER: 2, STANDARD: 1 };
  const matchedSponsors = catalog.b2bPartners
    .filter((p) => matchKeys.has(String(p.island_id || '').trim().toLowerCase()))
    .sort((a, b) => (sponsorRank[b.sponsor_tier] || 0) - (sponsorRank[a.sponsor_tier] || 0));

  for (const sp of matchedSponsors.slice(0, 2)) {
    const safeUrl = isSafeExternalUrl(sp.official_website_url)
      ? sp.official_website_url.trim()
      : `/island/${master.slug || idStr}`;
    partners.push({
      id: String(sp.id || sp.name),
      kind: 'sponsor_partner',
      badge: sp.sponsor_tier === 'GOLD' ? 'GOLD公認加盟店' : 'KIRATABI公認加盟店',
      name: sp.name,
      category: sp.category_detail || (sp.type === 'lodging' ? '宿泊施設' : '島内交通・体験'),
      perkText: sp.perk_text || undefined,
      url: safeUrl,
      isInternal: !safeUrl.startsWith('http'),
    });
  }

  // 2. 実在確認済み施設辞書 ＆ 管理画面の島別カスタムアフィリエイトURL
  const facilityData = getIslandFacilityDataOrDefault(idStr, islandName);
  const dbIsland = catalog.dbIslandsById.get(idStr);
  const customHotels = parseSafeJsonArray(dbIsland?.aff_hotel_url).filter((h) => isSafeExternalUrl(h.url));
  const customRentacars = parseSafeJsonArray(dbIsland?.aff_rentacar_url).filter((r) => isSafeExternalUrl(r.url));
  const customFerries = parseSafeJsonArray(dbIsland?.aff_ferry_url).filter((f) => isSafeExternalUrl(f.url));

  const specificTips = ISLAND_SPECIFIC_STAY_TIPS[idStr];
  const isBridgeIsland = /大橋|海中道路|橋で/.test(`${master.access || ''} ${master.description || ''}`);
  const needsRentacar =
    CAR_RECOMMENDED_ISLAND_IDS.has(idStr) ||
    isBridgeIsland ||
    facilityData.transports.some((t) => t.type === 'car');

  const stayTip =
    (aiStayHint && aiStayHint.trim()) ||
    specificTips?.stayTip ||
    (master.is_uninhabited
      ? `${cleanIslandName}は無人のため島内宿泊施設はありません。出発港周辺のホテル・宿を拠点に日帰りで訪問しましょう。`
      : `${cleanIslandName}の港・主要ビーチにアクセスしやすい集落周辺のホテル・民宿が便利です（連休や夏場は早めの空室確保を推奨）。`);

  const localStayNames = facilityData.accommodations.slice(0, 3).map((a) => a.name);

  const stayLinks: ConciergeLinkItem[] = [
    ...customHotels.slice(0, 2).map((h) => ({
      label: h.title || h.name || `${cleanIslandName}のおすすめ宿を見る`,
      url: String(h.url).trim(),
      provider: 'custom' as const,
    })),
    {
      label: `楽天トラベルで${cleanIslandName}の宿・空室を見る`,
      url: getRakutenTravelSearchUrl(cleanIslandName, prefecture),
      provider: 'rakuten',
    },
    {
      label: `じゃらんで${cleanIslandName}の宿を比較`,
      url: getJalanSearchUrl(cleanIslandName, prefecture),
      provider: 'jalan',
    },
  ];

  const mobilityTip =
    specificTips?.mobilityTip ||
    (needsRentacar
      ? `${cleanIslandName}はスポット間の距離があるため、空港・港発着または拠点エリアでのレンタカー事前予約が最も快適です。`
      : `${cleanIslandName}は港周辺のレンタサイクル・電動バイクや島内バス・徒歩で心地よく巡れます（出発空港・本土拠点でのレンタカー手配も併用可）。`);

  const localTransportNames = facilityData.transports
    .slice(0, 2)
    .map((t) => (t.priceRange ? `${t.name}（${t.priceRange}）` : t.name));

  const mobilityLinks: ConciergeLinkItem[] = [
    ...customFerries.slice(0, 1).map((f) => ({
      label: f.title || f.name || '乗船券・航路予約を見る',
      url: String(f.url).trim(),
      provider: 'custom' as const,
    })),
    ...customRentacars.slice(0, 1).map((r) => ({
      label: r.title || r.name || `${cleanIslandName}のレンタカー予約`,
      url: String(r.url).trim(),
      provider: 'custom' as const,
    })),
    {
      label: needsRentacar
        ? `楽天レンタカーで${prefecture || cleanIslandName}の車を探す`
        : `出発地・拠点空港のレンタカーを探す（楽天）`,
      url: getRakutenRentacarSearchUrl(cleanIslandName, prefecture),
      provider: 'rakuten',
    },
    {
      label: needsRentacar ? 'じゃらんレンタカーで料金比較' : 'じゃらんレンタカーを見る',
      url: getJalanRentacarSearchUrl(cleanIslandName, prefecture),
      provider: 'jalan',
    },
  ];

  return {
    islandId: idStr,
    islandName: cleanIslandName,
    prefecture,
    partners,
    stayTip,
    localStayNames,
    stayLinks,
    needsRentacar,
    mobilityTip,
    localTransportNames,
    mobilityLinks,
  };
}

export async function enrichRoutePlansWithMonetization(
  plans: any[],
  queryContext: string
): Promise<any[]> {
  if (!Array.isArray(plans) || plans.length === 0) return plans;

  const allIslandIds = Array.from(
    new Set(
      plans.flatMap((p) =>
        (Array.isArray(p?.route) ? p.route : [])
          .map((d: any) => String(d?.islandId || '').trim())
          .filter(Boolean)
      )
    )
  );

  const catalog = await fetchLivePartnerCatalog(allIslandIds);

  return plans.map((plan) => {
    const seenInPlan = new Set<string>();
    const islandGuides: IslandConciergeGuide[] = [];
    const routeTextParts: string[] = [
      String(plan?.title || ''),
      String(plan?.description || ''),
      queryContext,
    ];

    const enrichedRoute = (Array.isArray(plan?.route) ? plan.route : []).map((day: any) => {
      routeTextParts.push(String(day?.activity || ''), String(day?.transportation || ''));
      const idStr = String(day?.islandId || '').trim();
      const guide = idStr ? buildIslandConciergeGuide(idStr, catalog, day?.stayHint) : null;
      if (guide && !seenInPlan.has(idStr)) {
        seenInPlan.add(idStr);
        islandGuides.push(guide);
      }
      return {
        ...day,
        conciergeGuide: guide,
      };
    });

    return {
      ...plan,
      route: enrichedRoute,
      islandGuides,
      gearPicks: pickRelevantGearForContext(routeTextParts.join(' ')),
    };
  });
}

export async function enrichRecommendPlansWithMonetization(
  plans: any[],
  queryContext: string
): Promise<any[]> {
  if (!Array.isArray(plans) || plans.length === 0) return plans;

  const allIslandIds = Array.from(
    new Set(plans.map((p) => String(p?.id || '').trim()).filter(Boolean))
  );
  const catalog = await fetchLivePartnerCatalog(allIslandIds);

  return plans.map((plan) => {
    const idStr = String(plan?.id || '').trim();
    const guide = idStr ? buildIslandConciergeGuide(idStr, catalog, plan?.stayHint) : null;
    const gearPicks = pickRelevantGearForContext(
      `${queryContext} ${plan?.theme || ''} ${plan?.reason || ''}`
    );
    return {
      ...plan,
      conciergeGuide: guide,
      gearPicks: gearPicks.slice(0, 1),
    };
  });
}
