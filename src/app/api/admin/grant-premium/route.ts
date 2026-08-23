import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAdminPassword } from '@/lib/adminAuth';

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

export async function POST(req: NextRequest) {
  const ADMIN_PASSWORD = await getAdminPassword();
  const auth = req.headers.get('x-admin-password');
  if (!auth || auth !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }
  if (!SERVICE_ROLE_KEY || SERVICE_ROLE_KEY === 'REPLACE_WITH_YOUR_SERVICE_ROLE_KEY') {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY が未設定です' }, { status: 503 });
  }

  const { userId, tier, months } = await req.json();
  if (!userId || !tier) {
    return NextResponse.json({ error: 'userId と tier が必要です' }, { status: 400 });
  }
  if (!['premium', 'ultimate', 'free'].includes(tier)) {
    return NextResponse.json({ error: '無効なプランです (premium / ultimate / free)' }, { status: 400 });
  }

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  // premium_until を計算（free の場合はnull）
  let premium_until = null;
  const expiryMonths = months || 12; // デフォルト12ヶ月
  if (tier !== 'free') {
    const until = new Date();
    until.setMonth(until.getMonth() + expiryMonths);
    premium_until = until.toISOString();
  }

  // ultimate_started_at: ultimate に変更する場合は今日を記録
  const ultimate_started_at = tier === 'ultimate' ? new Date().toISOString() : null;

  const updateData: Record<string, unknown> = {
    subscription_tier: tier,
    premium_until,
  };
  if (tier === 'ultimate') {
    updateData.ultimate_started_at = ultimate_started_at;
  }

  const { error } = await adminClient
    .from('user_profiles')
    .update(updateData)
    .eq('id', userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: `✅ ユーザー ${userId} を「${tier}」プランに設定しました（有効期限: ${premium_until ? new Date(premium_until).toLocaleDateString('ja-JP') : '無期限'}）`
  });
}
