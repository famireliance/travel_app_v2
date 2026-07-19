import { createClient } from '@supabase/supabase-js';
import { FALLBACK_ISLANDS } from '@/data/islandsData';
import { RICH_ISLAND_INFO_DICTIONARY } from '@/data/richDescriptions';
import { ALL_ISLANDS_MASTER_DICTIONARY } from '@/data/allIslandsMaster';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_anon_key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const REGION_COORDINATE_ATLAS: Record<string, [number, number]> = {
  'izu': [34.3, 139.3],
  'ogasawara': [27.09, 142.19],
  'yaeyama': [24.34, 124.15],
  'miyako': [24.80, 125.28],
  'amami': [28.37, 129.49],
  'tokara': [29.50, 129.70],
  'daito': [25.85, 131.23],
  'okinawa_main': [26.31, 127.80],
  'goto': [32.69, 128.84],
  'setouchi': [34.48, 134.23],
  'naoshima': [34.46, 133.99],
  'shodoshima': [34.48, 134.19],
  'hokkaido': [45.18, 141.24],
  'oki': [36.20, 133.33],
  'osumi': [30.33, 130.52],
  'amakusa': [32.46, 130.18],
  'iki': [33.78, 129.68],
  'kamijima': [34.25, 133.15],
  'bungo': [33.0, 131.9],
  'genkai': [33.55, 130.0],
  'kerama': [26.19, 127.31],
  'hirado': [33.36, 129.55],
  'kume': [26.35, 126.78],
  'koshiki': [31.81, 129.85],
  'chikuzen': [33.85, 130.42],
  'aichi_santo': [34.70, 137.04],
  'ieshima': [34.66, 134.53],
  'kasaoka': [34.40, 133.53],
  'hagi': [34.45, 131.40],
  'kutsuna': [33.98, 132.65],
  'minami_naka': [32.50, 131.70],
};

const PREFECTURE_COORDINATE_ATLAS: Record<string, [number, number]> = {
  '沖縄県': [26.31, 127.80],
  '鹿児島県': [29.20, 129.60],
  '長崎県': [33.15, 129.25],
  '熊本県': [32.45, 130.20],
  '大分県': [33.05, 131.90],
  '福岡県': [33.70, 130.30],
  '佐賀県': [33.55, 129.85],
  '宮崎県': [32.45, 131.65],
  '愛媛県': [34.10, 133.10],
  '香川県': [34.45, 134.15],
  '広島県': [34.30, 132.60],
  '岡山県': [34.45, 133.65],
  '山口県': [34.15, 131.60],
  '島根県': [36.20, 133.33],
  '兵庫県': [34.66, 134.53],
  '東京都': [33.50, 139.60],
  '愛知県': [34.70, 137.04],
  '三重県': [34.35, 136.85],
  '静岡県': [34.75, 138.75],
  '神奈川県': [35.15, 139.60],
  '千葉県': [35.05, 139.85],
  '宮城県': [38.32, 141.10],
  '山形県': [38.85, 139.65],
  '秋田県': [39.90, 139.75],
  '新潟県': [38.02, 138.37],
  '石川県': [37.45, 136.90],
  '北海道': [45.18, 141.24],
};

// データベース側で誤配備・誤座標になっている主要島を確実に正確な地理・エリアに補正する辞書
const ACCURATE_ISLAND_DIRECTORY: Record<string, { coordinates: string; region_id: string; prefecture?: string }> = {
  '屋我地島': { coordinates: '26.6534, 128.0142', region_id: 'okinawa_main', prefecture: '沖縄県' },
  '古宇利島': { coordinates: '26.7000, 128.0236', region_id: 'okinawa_main', prefecture: '沖縄県' },
  '沖縄本島': { coordinates: '26.3100, 127.8000', region_id: 'okinawa_main', prefecture: '沖縄県' },
  '瀬底島': { coordinates: '26.6431, 127.8631', region_id: 'okinawa_main', prefecture: '沖縄県' },
  '水納島': { coordinates: '26.6472, 127.8139', region_id: 'okinawa_main', prefecture: '沖縄県' },
  '伊江島': { coordinates: '26.7167, 127.8000', region_id: 'okinawa_main', prefecture: '沖縄県' },
  '伊是名島': { coordinates: '26.9314, 127.9408', region_id: 'okinawa_main', prefecture: '沖縄県' },
  '伊平屋島': { coordinates: '27.0378, 127.9686', region_id: 'okinawa_main', prefecture: '沖縄県' },
  '野甫島': { coordinates: '27.0267, 127.9542', region_id: 'okinawa_main', prefecture: '沖縄県' },
  '久高島': { coordinates: '26.1606, 127.8931', region_id: 'okinawa_main', prefecture: '沖縄県' },
  '瀬長島': { coordinates: '26.1747, 127.6436', region_id: 'okinawa_main', prefecture: '沖縄県' },
  '奥武島': { coordinates: '26.1306, 127.7736', region_id: 'okinawa_main', prefecture: '沖縄県' },
  '浜比嘉島': { coordinates: '26.3194, 127.9569', region_id: 'okinawa_main', prefecture: '沖縄県' },
  '平安座島': { coordinates: '26.3472, 127.9542', region_id: 'okinawa_main', prefecture: '沖縄県' },
  '宮城島': { coordinates: '26.3681, 127.9819', region_id: 'okinawa_main', prefecture: '沖縄県' },
  '伊計島': { coordinates: '26.3931, 127.9958', region_id: 'okinawa_main', prefecture: '沖縄県' },
  '津堅島': { coordinates: '26.2522, 127.9425', region_id: 'okinawa_main', prefecture: '沖縄県' },
  '藪地島': { coordinates: '26.3211, 127.9286', region_id: 'okinawa_main', prefecture: '沖縄県' },
  '宮古島': { coordinates: '24.8055, 125.2811', region_id: 'miyako', prefecture: '沖縄県' },
  '池間島': { coordinates: '24.9314, 125.2425', region_id: 'miyako', prefecture: '沖縄県' },
  '大神島': { coordinates: '24.9167, 125.3083', region_id: 'miyako', prefecture: '沖縄県' },
  '来間島': { coordinates: '24.7214, 125.2536', region_id: 'miyako', prefecture: '沖縄県' },
  '伊良部島': { coordinates: '24.8344, 125.1844', region_id: 'miyako', prefecture: '沖縄県' },
  '下地島': { coordinates: '24.8186, 125.1481', region_id: 'miyako', prefecture: '沖縄県' },
  '多良間島': { coordinates: '24.6611, 124.7042', region_id: 'miyako', prefecture: '沖縄県' },
  '水納島（多良間）': { coordinates: '24.6986, 124.7175', region_id: 'miyako', prefecture: '沖縄県' },
  '石垣島': { coordinates: '24.4064, 124.1856', region_id: 'yaeyama', prefecture: '沖縄県' },
  '竹富島': { coordinates: '24.3275, 124.0883', region_id: 'yaeyama', prefecture: '沖縄県' },
  '小浜島': { coordinates: '24.3392, 123.9806', region_id: 'yaeyama', prefecture: '沖縄県' },
  '黒島': { coordinates: '24.2394, 124.0133', region_id: 'yaeyama', prefecture: '沖縄県' },
  '新城島上地': { coordinates: '24.2344, 123.9469', region_id: 'yaeyama', prefecture: '沖縄県' },
  '新城島下地': { coordinates: '24.2144, 123.9319', region_id: 'yaeyama', prefecture: '沖縄県' },
  '西表島': { coordinates: '24.3267, 123.8206', region_id: 'yaeyama', prefecture: '沖縄県' },
  '由布島': { coordinates: '24.3439, 123.9350', region_id: 'yaeyama', prefecture: '沖縄県' },
  '鳩間島': { coordinates: '24.4717, 123.8214', region_id: 'yaeyama', prefecture: '沖縄県' },
  '波照間島': { coordinates: '24.0567, 123.7783', region_id: 'yaeyama', prefecture: '沖縄県' },
  '与那国島': { coordinates: '24.4678, 122.9878', region_id: 'yaeyama', prefecture: '沖縄県' },
  '八丈島': { coordinates: '33.1128, 139.7953', region_id: 'izu', prefecture: '東京都' },
  '伊豆大島': { coordinates: '34.7500, 139.3833', region_id: 'izu', prefecture: '東京都' },
  '父島': { coordinates: '27.0950, 142.1917', region_id: 'ogasawara', prefecture: '東京都' },
  '母島': { coordinates: '26.6567, 142.1583', region_id: 'ogasawara', prefecture: '東京都' },
  '屋久島': { coordinates: '30.3347, 130.5219', region_id: 'osumi', prefecture: '鹿児島県' },
  '種子島': { coordinates: '30.5694, 130.9856', region_id: 'osumi', prefecture: '鹿児島県' },
  '奄美大島': { coordinates: '28.3769, 129.4939', region_id: 'amami', prefecture: '鹿児島県' },
  '与論島': { coordinates: '27.0436, 128.4319', region_id: 'amami', prefecture: '鹿児島県' },
  '佐渡島': { coordinates: '38.0186, 138.3686', region_id: 'oki', prefecture: '新潟県' },
  '小豆島': { coordinates: '34.5167, 134.2500', region_id: 'setouchi', prefecture: '香川県' },
  '直島': { coordinates: '34.4608, 133.9961', region_id: 'naoshima', prefecture: '香川県' },
};

export async function fetchAllIslands(): Promise<any[]> {
  try {
    // Only fetch published islands for the user app, ordered by popularity
    const { data, error } = await supabase
      .from('islands')
      .select('*')
      .eq('is_published', true)
      .order('popularity_score', { ascending: false });
      
    if (!error && data && data.length > 0) {
      return data;
    }
  } catch (err) {
  }
  return FALLBACK_ISLANDS;
}

export async function fetchSiteSettings(): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .eq('id', 1)
      .single();
    if (!error && data) return data;
  } catch (err) {
    console.error("Failed to fetch site settings", err);
  }
  return null;
}

// ==========================================
// Phase 6: アドサーバー (Ad Campaigns)
// ==========================================
export const fetchAdCampaigns = async (islandId?: string, regionId?: string) => {
  try {
    let query = supabase.from('ad_campaigns').select('*')
      .eq('is_active', true)
      .neq('banner_url', ''); // 安全対策: バナーURLが空のものをシステムレベルでブロック
    
    if (islandId || regionId) {
      let orString = 'target_type.eq.global';
      if (regionId) orString += `,and(target_type.eq.region,target_id.eq.${regionId})`;
      if (islandId) orString += `,and(target_type.eq.island,target_id.ilike.*${islandId}*)`; // JSON配列文字列の部分一致検索
      
      query = query.or(orString);
    } else {
      query = query.eq('target_type', 'global');
    }

    const { data, error } = await query;
    if (error) throw error;
    
    return (data || []).sort(() => Math.random() - 0.5);
  } catch (error) {
    console.error('Error fetching ad campaigns:', error);
    return [];
  }
};

