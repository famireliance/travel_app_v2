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

export const DEFAULT_CELL_NOTES: Record<string, string> = {
  hachijojima: '集落内・港周辺は4G/5G快調。山間部・外海航路はdocomoが最も安定。',
  ishigakijima: '市街地・主要道路は全社5G/4G良好。山間部や北部海岸はdocomo・au推奨。',
  aogashima: '集落内（東台）はdocomo/au安定。カルデラ内は電波微弱エリアあり。',
  amami: '港・空港・名瀬市街は全社4G。山間部・トンネルはdocomo推奨。',
};

/** island_public_wifi テーブル操作用クライアント（Service Role使用） */
export function getDbClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!key || !url || key.startsWith('REPLACE')) return null;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function getWifiSpots(islandId?: string): Promise<PublicWifiSpot[]> {
  const client = getDbClient();
  if (!client) return [];
  
  let query = client.from('island_public_wifi').select('*').order('created_at', { ascending: false });
  if (islandId) {
    query = query.eq('island_id', islandId);
  }
  
  const { data, error } = await query;
  if (error) {
    console.error('[wifiStore] getWifiSpots error:', error);
    return [];
  }
  return data || [];
}

export async function saveWifiSpot(spot: Partial<PublicWifiSpot>): Promise<PublicWifiSpot | null> {
  const client = getDbClient();
  if (!client) throw new Error('DB Client is not available');

  const payload = {
    ...spot,
    id: spot.id || `spot_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await client.from('island_public_wifi').upsert(payload).select().single();
  if (error) {
    console.error('[wifiStore] saveWifiSpot error:', error);
    throw error;
  }
  return data;
}

export async function deleteWifiSpot(id: string): Promise<boolean> {
  const client = getDbClient();
  if (!client) throw new Error('DB Client is not available');
  
  const { error } = await client.from('island_public_wifi').delete().eq('id', id);
  if (error) {
    console.error('[wifiStore] deleteWifiSpot error:', error);
    return false;
  }
  return true;
}

export function sanitizeText(v: unknown, max = 200): string {
  return String(v ?? '').replace(/[<>\u0000-\u001f]/g, '').trim().slice(0, max);
}
