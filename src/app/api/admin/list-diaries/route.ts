import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/adminAuth';
import { getFallbackJson } from '@/lib/adminConfigFallback';

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: '認証エラー' }, { status: 401 });
  }
  if (!SERVICE_ROLE_KEY || SERVICE_ROLE_KEY.startsWith('REPLACE')) {
    return NextResponse.json({ error: 'SERVICE_ROLE_KEY未設定' }, { status: 503 });
  }
  const client = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  const [{ data, error }, hiddenIds] = await Promise.all([
    client
      .from('island_diaries')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100),
    getFallbackJson<string[]>('fallback_hidden_diaries', []),
  ]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const hiddenSet = new Set(Array.isArray(hiddenIds) ? hiddenIds.map(String) : []);
  const enriched = (data || []).map((d: any) => ({
    ...d,
    is_hidden: d.is_hidden ?? hiddenSet.has(String(d.id)),
  }));

  return NextResponse.json(enriched);
}
