import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser, isSuperAdmin } from '@/lib/adminAuth';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getAdminClient() {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }
  if (!isSuperAdmin(user)) {
    return NextResponse.json({ error: '最高管理者権限が必要です' }, { status: 403 });
  }

  const client = getAdminClient();
  const { data, error } = await client
    .from('app_promo_codes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ codes: [] });
  }

  return NextResponse.json({ codes: data || [] });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }
  if (user.role === 'viewer') {
    return NextResponse.json({ error: '閲覧専用アカウントのため変更操作はできません' }, { status: 403 });
  }
  if (!isSuperAdmin(user)) {
    return NextResponse.json({ error: '最高管理者権限が必要です' }, { status: 403 });
  }

  try {
    const { code, reward_amount } = await req.json();
    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'コードが必要です' }, { status: 400 });
    }

    const client = getAdminClient();
    const { data, error } = await client
      .from('app_promo_codes')
      .insert({
        code: code.trim(),
        reward_amount: Number(reward_amount) || 1,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, promoCode: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || '発行に失敗しました' }, { status: 500 });
  }
}
