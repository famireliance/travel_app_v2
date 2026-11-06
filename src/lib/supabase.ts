import { createClient } from '@supabase/supabase-js';
import { FALLBACK_ISLANDS } from '@/data/islandsData';
import { ALL_ISLANDS_MASTER_DICTIONARY } from '@/data/allIslandsMaster';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_anon_key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce',
  },
});

// ==========================================
// 📊 トラッキング・アナリティクス API (従量課金用)
// ==========================================
export async function trackFacilityEvent(
  facilityId: string, 
  eventType: 'phone_call_click' | 'website_click' | 'lp_view'
) {
  try {
    const { error } = await supabase
      .from('tracking_events')
      .insert([
        {
          facility_id: facilityId,
          event_type: eventType,
          user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
          session_id: typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('kiratabi_session_id') : null
        }
      ]);
    if (error) {
      console.error('Tracking event failed:', error);
    }
  } catch (err) {
    // ユーザーの体験を阻害しないよう、エラーは裏側でキャッチのみ
  }
}


export async function fetchAllIslands(): Promise<Record<string, unknown>[]> {
  try {
    // Fetch published islands from Supabase and merge strictly against authoritative ALL_ISLANDS_MASTER_DICTIONARY
    const { data, error } = await supabase
      .from('islands')
      .select('*')
      .eq('is_published', true)
      .order('popularity_score', { ascending: false });
      
    if (!error && data && data.length > 0) {
      const dbById = new Map<string, Record<string, any>>();
      for (const row of data) {
        const idStr = String(row.id);
        if (ALL_ISLANDS_MASTER_DICTIONARY[idStr]) {
          dbById.set(idStr, row);
        }
      }

      const merged: Record<string, unknown>[] = [];
      for (const master of Object.values(ALL_ISLANDS_MASTER_DICTIONARY) as any[]) {
        if (master.is_conquest_target === false || !master.coordinates) continue;
        const idStr = String(master.id);
        const row = dbById.get(idStr);

        if (row) {
          merged.push({
            ...row,
            id: master.id,
            name: master.name,
            slug: master.slug || row.slug,
            region_id: master.region_id || row.region_id,
            prefecture: master.prefecture || row.prefecture,
            coordinates: master.coordinates,
            description: row.description || master.description || '',
            access: row.access || master.access || '',
            tags: (Array.isArray(row.tags) && row.tags.length > 0) ? row.tags : (master.tags || []),
            is_conquest_target: true,
            is_published: true,
          });
        } else {
          merged.push({
            id: master.id,
            name: master.name,
            slug: master.slug,
            region_id: master.region_id || 'other',
            prefecture: master.prefecture || '',
            difficulty: master.difficulty === '未設定' ? 2 : (typeof master.difficulty === 'number' ? master.difficulty : 2),
            coordinates: master.coordinates,
            description: master.description || '',
            access: master.access || '',
            tags: master.tags || [],
            spots: master.spots || [],
            image_url: master.image_url || '',
            hero_image_url: master.hero_image_url || master.image_url || '',
            popularity_score: 0,
            is_published: true,
            is_conquest_target: true,
          });
        }
      }

      // Preserve popularity_score ordering from DB
      merged.sort((a: any, b: any) => (Number(b.popularity_score) || 0) - (Number(a.popularity_score) || 0));
      return merged;
    }
  } catch {
  }
  return FALLBACK_ISLANDS as any;
}

export async function fetchSiteSettings(): Promise<Record<string, unknown> | null> {
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
export const fetchAdCampaigns = async (islandId?: string, regionId?: string, prefecture?: string, area?: string) => {
  try {
    let query = supabase.from('ad_campaigns').select('*')
      .eq('is_active', true)
      .neq('banner_url', ''); // 安全対策: バナーURLが空のものをシステムレベルでブロック
    
    if (islandId || regionId || prefecture || area) {
      // 記号や制御文字を除去してPostgREST構文破綻を完全に防止
      const clean = (s: string) => s.replace(/[^a-zA-Z0-9_\-\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/g, '');
      let orString = 'target_type.eq.global';
      if (regionId) orString += `,and(target_type.eq.region,target_id.eq.${clean(regionId)})`;
      if (prefecture) orString += `,and(target_type.eq.prefecture,target_id.eq.${clean(prefecture)})`;
      if (area) orString += `,and(target_type.eq.area,target_id.eq.${clean(area)})`;
      if (islandId) orString += `,and(target_type.eq.island,target_id.ilike.*${clean(islandId)}*)`; // JSON配列文字列の部分一致検索
      
      query = query.or(orString);
    } else {
      query = query.eq('target_type', 'global');
    }

    const { data, error } = await query;
    if (error) throw error;
    
    return (data || []).sort(() => Math.random() - 0.5);
  } catch (error) {
    console.error('Error fetching ad campaigns:', (error as any)?.message || JSON.stringify(error) || error);
    return [];
  }
};

