import { createClient } from '@supabase/supabase-js';
import { getFallbackJson, setFallbackJson } from '@/lib/adminConfigFallback';
import { ALL_ISLANDS_MASTER_DICTIONARY } from '@/data/allIslandsMaster';

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

const SLUG_ALIASES: Record<string, string[]> = {
  hachijojima: ['74', 'hachijojima'],
  ishigakijima: ['392', 'ishigakijima', 'ishigaki'],
  aogashima: ['75', 'aogashima'],
  amami: ['334', 'amami', 'amamioshima'],
  miyako: ['384', 'miyako', 'miyakojima'],
  oshima: ['66', 'oshima', 'izuoshima'],
  chichijima: ['76', 'chichijima'],
};

/**
 * 数値ID（例: "74"）とスラッグ（例: "hachijojima"）の双方を解決して候補リストを返す
 */
export function resolveIslandIdCandidates(rawId: string): string[] {
  const clean = String(rawId || '').trim().toLowerCase();
  if (!clean) return [];
  const candidates = new Set<string>([clean, String(rawId).trim()]);

  if (SLUG_ALIASES[clean]) {
    SLUG_ALIASES[clean].forEach((a) => candidates.add(a));
  }
  for (const [aliasKey, list] of Object.entries(SLUG_ALIASES)) {
    if (list.includes(clean)) {
      candidates.add(aliasKey);
      list.forEach((a) => candidates.add(a));
    }
  }

  const direct = ALL_ISLANDS_MASTER_DICTIONARY[clean] || ALL_ISLANDS_MASTER_DICTIONARY[String(rawId).trim()];
  if (direct) {
    candidates.add(String(direct.id));
    if (direct.slug) candidates.add(String(direct.slug).toLowerCase());
  } else {
    const bySlugOrName = Object.values(ALL_ISLANDS_MASTER_DICTIONARY).find(
      (i) => String(i.slug || '').toLowerCase() === clean || String(i.name || '') === String(rawId).trim()
    );
    if (bySlugOrName) {
      candidates.add(String(bySlugOrName.id));
      if (bySlugOrName.slug) candidates.add(String(bySlugOrName.slug).toLowerCase());
    }
  }

  return Array.from(candidates);
}

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
    const candidates = resolveIslandIdCandidates(islandId);
    if (candidates.length > 1) {
      query = query.in('island_id', candidates);
    } else {
      query = query.eq('island_id', islandId);
    }
  }

  const { data, error } = await query;
  if (error) {
    console.error('[wifiStore] getWifiSpots error:', error);
    return [];
  }
  return data || [];
}

export async function getCellNotes(): Promise<Record<string, string>> {
  const saved = await getFallbackJson<Record<string, string>>('wifi_cell_notes', {});
  return {
    ...DEFAULT_CELL_NOTES,
    ...(saved || {}),
  };
}

export async function getCellNoteForIsland(islandId: string): Promise<string | null> {
  const notes = await getCellNotes();
  const candidates = resolveIslandIdCandidates(islandId);
  for (const key of candidates) {
    if (notes[key]) return notes[key];
  }
  return null;
}

export async function saveCellNote(islandId: string, cellNote: string): Promise<Record<string, string>> {
  const saved = await getFallbackJson<Record<string, string>>('wifi_cell_notes', {});
  const next = {
    ...DEFAULT_CELL_NOTES,
    ...(saved || {}),
  };
  const candidates = resolveIslandIdCandidates(islandId);
  const cleanNote = sanitizeText(cellNote, 400);
  next[islandId] = cleanNote;
  for (const c of candidates) {
    next[c] = cleanNote;
  }
  await setFallbackJson('wifi_cell_notes', next);
  return next;
}

export async function saveWifiSpot(spot: Partial<PublicWifiSpot>): Promise<PublicWifiSpot | null> {
  const client = getDbClient();
  if (!client) throw new Error('DB Client is not available');

  const payload = {
    ...spot,
    id: spot.id || `spot_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    updated_at: new Date().toISOString(),
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
  return String(v ?? '')
    .replace(/[<>\u0000-\u001f]/g, '')
    .trim()
    .slice(0, max);
}
