import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/adminAuth';

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }
  if (!SERVICE_ROLE_KEY || SERVICE_ROLE_KEY === 'REPLACE_WITH_YOUR_SERVICE_ROLE_KEY') {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY が未設定です' }, { status: 503 });
  }

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  // Supabase Auth から全ユーザーを取得
  const { data: authData, error: authError } = await adminClient.auth.admin.listUsers();
  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 });

  // user_profiles & user_gamification & island_visits を一括取得
  const [
    { data: profilesData },
    { data: gamificationData },
    { data: visitsData }
  ] = await Promise.all([
    adminClient.from('user_profiles').select('*'),
    adminClient.from('user_gamification').select('user_id, total_xp'),
    adminClient.from('island_visits').select('user_id, status')
  ]);

  const profileMap = new Map((profilesData || []).map((p: any) => [p.id, p]));
  const xpMap = new Map((gamificationData || []).map((g: any) => [g.user_id, g.total_xp]));

  // ユーザー情報を突合
  const userMap = authData.users.map(u => {
    const userVisits = visitsData?.filter(v => 
      v.user_id === u.id && 
      (v.status === 'visited' || v.status === 'verified_visited')
    ) || [];

    const prof: any = profileMap.get(u.id);

    return {
      id: u.id,
      email: u.email,
      nickname: prof?.nickname || '名無し',
      subscription_tier: prof?.subscription_tier || 'free',
      high_quality_tickets: prof?.high_quality_tickets || 0,
      premium_until: prof?.premium_until || null,
      total_points: prof?.total_points ?? xpMap.get(u.id) ?? 0,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      visitCount: userVisits.length
    };
  });

  return NextResponse.json(userMap);
}
