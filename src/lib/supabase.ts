import { createClient } from '@supabase/supabase-js';
import { FALLBACK_ISLANDS } from '@/data/islandsData';

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
    // Only fetch published islands for the user app, ordered by popularity
    const { data, error } = await supabase
      .from('islands')
      .select('*')
      .eq('is_published', true)
      .order('popularity_score', { ascending: false });
      
    if (!error && data && data.length > 0) {
      return data;
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
      let orString = 'target_type.eq.global';
      if (regionId) orString += `,and(target_type.eq.region,target_id.eq.${regionId})`;
      if (prefecture) orString += `,and(target_type.eq.prefecture,target_id.eq.${prefecture})`;
      if (area) orString += `,and(target_type.eq.area,target_id.eq.${area})`;
      if (islandId) orString += `,and(target_type.eq.island,target_id.ilike.*${islandId}*)`; // JSON配列文字列の部分一致検索
      
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

