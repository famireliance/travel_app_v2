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

export const SLUG_ALIASES: Record<string, string[]> = {
  hachijojima: ['56', 'hachijojima', 'hachijo', '八丈島'],
  aogashima: ['58', 'aogashima', '青ヶ島'],
  chichijima: ['63', 'chichijima', 'chichijimaogasawarashoto', '父島'],
  oshima: ['49', 'oshima', 'izuoshima', '大島', '伊豆大島'],
  amami: ['352', 'amamioshima', 'amami', '奄美大島'],
  miyako: ['386', 'miyakojima', 'miyako', '宮古島'],
  ishigakijima: ['392', 'ishigakijima', 'ishigaki', '石垣島'],
};

/**
 * 数値ID（例: "56"）とスラッグ（例: "hachijojima"）の双方を解決して候補リストを返す
 */
export function resolveIslandIdCandidates(rawId: string): string[] {
  const trimmed = String(rawId || '').trim();
  const clean = trimmed.toLowerCase();
  if (!clean) return [];
  const candidates = new Set<string>([clean, trimmed]);

  if (SLUG_ALIASES[clean]) {
    SLUG_ALIASES[clean].forEach((a) => candidates.add(a));
  }
  for (const [aliasKey, list] of Object.entries(SLUG_ALIASES)) {
    if (list.some((a) => a.toLowerCase() === clean || a === trimmed)) {
      candidates.add(aliasKey);
      list.forEach((a) => candidates.add(a));
    }
  }

  const direct = ALL_ISLANDS_MASTER_DICTIONARY[clean] || ALL_ISLANDS_MASTER_DICTIONARY[trimmed];
  if (direct) {
    candidates.add(String(direct.id));
    if (direct.slug) candidates.add(String(direct.slug).toLowerCase());
  } else {
    const bySlugOrName = Object.values(ALL_ISLANDS_MASTER_DICTIONARY).find(
      (i) => String(i.slug || '').toLowerCase() === clean || String(i.name || '') === trimmed
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
  if (client) {
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
    if (!error && data) {
      return data;
    }
  }

  // Fallback to admin_config when standalone wifi table does not exist
  const fbSpots = await getFallbackJson<PublicWifiSpot[]>('fallback_wifi_spots', []);
  const list = Array.isArray(fbSpots) ? fbSpots : [];
  if (!islandId) return list;

  const candidateSet = new Set(resolveIslandIdCandidates(islandId).map((c) => c.toLowerCase()));
  return list.filter((s) => candidateSet.has(String(s.island_id || '').toLowerCase()));
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
  const now = new Date().toISOString();
  const payload: PublicWifiSpot = {
    id: spot.id || `spot_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    island_id: String(spot.island_id || ''),
    name: String(spot.name || ''),
    location: String(spot.location || '館内・待合スペース'),
    ssid: String(spot.ssid || ''),
    has_password: Boolean(spot.has_password),
    password: spot.password || '',
    auth_method: String(spot.auth_method || 'ブラウザ認証 / 同意のみ'),
    notes: spot.notes || '',
    is_verified: spot.is_verified ?? true,
    created_at: spot.created_at || now,
    updated_at: now,
    updated_by: spot.updated_by,
  };

  const client = getDbClient();
  if (client) {
    const { data, error } = await client.from('island_public_wifi').upsert(payload).select().single();
    if (!error && data) {
      return data;
    }
  }

  // Fallback to admin_config when standalone wifi table does not exist
  const fbSpots = await getFallbackJson<PublicWifiSpot[]>('fallback_wifi_spots', []);
  const list = Array.isArray(fbSpots) ? fbSpots : [];
  const idx = list.findIndex((s) => s.id === payload.id);
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...payload };
  } else {
    list.unshift(payload);
  }
  await setFallbackJson('fallback_wifi_spots', list);
  return payload;
}

export async function deleteWifiSpot(id: string): Promise<boolean> {
  const client = getDbClient();
  if (client) {
    const { error } = await client.from('island_public_wifi').delete().eq('id', id);
    if (!error) {
      return true;
    }
  }

  const fbSpots = await getFallbackJson<PublicWifiSpot[]>('fallback_wifi_spots', []);
  const list = Array.isArray(fbSpots) ? fbSpots : [];
  const filtered = list.filter((s) => s.id !== id);
  await setFallbackJson('fallback_wifi_spots', filtered);
  return true;
}

export function sanitizeText(v: unknown, max = 200): string {
  return String(v ?? '')
    .replace(/[<>\u0000-\u001f]/g, '')
    .trim()
    .slice(0, max);
}
