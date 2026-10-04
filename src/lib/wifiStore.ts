import { createClient } from '@supabase/supabase-js';

export interface PublicWifiSpot {
  id: string;
  island_id: string;
  name: string;
  location: string;
  ssid: string;
  has_password: boolean;
  password?: string;
  auth_method: string;
  notes?: string;
  is_verified?: boolean;
  created_at: string;
  updated_at: string;
  updated_by?: string;
}

const seed = (p: Omit<PublicWifiSpot, 'created_at' | 'updated_at' | 'updated_by' | 'is_verified'>): PublicWifiSpot => ({
  ...p,
  is_verified: true,
  created_at: '2026-09-01T00:00:00Z',
  updated_at: '2026-09-01T00:00:00Z',
  updated_by: 'system_preset',
});

export const DEFAULT_WIFI_SPOTS: PublicWifiSpot[] = [
  seed({ id: 'spot_tokyo_01', island_id: 'hachijojima', name: '底土港 船客待合所', location: '1Fロビー・待合スペース', ssid: 'FREE_Wi-Fi_and_TOKYO', has_password: false, auth_method: 'ブラウザ利用規約同意（無料）', notes: '乗船前や到着直後の通信に。' }),
  seed({ id: 'spot_tokyo_02', island_id: 'hachijojima', name: '八丈町役場 本庁舎', location: '1F窓口ロビー', ssid: 'TOKYO_FREE_Wi-Fi', has_password: false, auth_method: 'メールアドレスまたはSNS認証', notes: '開庁時間中に利用可能。' }),
  seed({ id: 'spot_tokyo_03', island_id: 'hachijojima', name: '八丈島観光協会', location: '案内所内', ssid: 'Shimapo_Free_WiFi', has_password: false, auth_method: 'ワンタップ接続', notes: '観光情報の閲覧に便利。' }),
  seed({ id: 'spot_yaeyama_01', island_id: 'ishigakijima', name: '離島ターミナル', location: 'フェリー乗り場ロビー', ssid: 'Be_Okinawa_Free_Wi-Fi', has_password: false, auth_method: '多言語Web認証（無料）', notes: '出航待ちに最適。' }),
  seed({ id: 'spot_yaeyama_02', island_id: 'ishigakijima', name: '石垣市役所', location: '1F市民ラウンジ', ssid: 'Yaeyama_Free_Wi-Fi', has_password: false, auth_method: 'ワンタップ接続', notes: '市街地散策時に。' }),
];

export const DEFAULT_CELL_NOTES: Record<string, string> = {
  hachijojima: '集落内・港周辺は4G/5G快調。山間部・外海航路はdocomoが最も安定。',
  ishigakijima: '市街地・主要道路は全社5G/4G良好。山間部や北部海岸はdocomo・au推奨。',
  aogashima: '集落内（東台）はdocomo/au安定。カルデラ内は電波微弱エリアあり。',
  amami: '港・空港・名瀬市街は全社4G。山間部・トンネルはdocomo推奨。',
};

// Next.jsでは route 毎にモジュールが分離され得るため globalThis で単一ストアを共有
type Store = { spots: PublicWifiSpot[]; cellNotes: Record<string, string> };
const g = globalThis as unknown as { __wifiStore?: Store };
export function getWifiStore(): Store {
  if (!g.__wifiStore) {
    g.__wifiStore = { spots: [...DEFAULT_WIFI_SPOTS], cellNotes: { ...DEFAULT_CELL_NOTES } };
  }
  return g.__wifiStore;
}

/** island_public_wifi テーブルが使えるときだけクライアントを返す */
export function getDbClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!key || !url || key.startsWith('REPLACE')) return null;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

/** 表示用：HTML/制御文字を除去し長さ制限（XSS・異常入力対策） */
export function sanitizeText(v: unknown, max = 200): string {
  return String(v ?? '').replace(/[<>\u0000-\u001f]/g, '').trim().slice(0, max);
}
