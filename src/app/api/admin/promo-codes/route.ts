import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser, isSuperAdmin } from '@/lib/adminAuth';
import { getFallbackJson, setFallbackJson } from '@/lib/adminConfigFallback';

const FALLBACK_PROMO_KEY = 'fallback_promo_codes';

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || key.startsWith('REPLACE')) return null;
  return createClient(url, key, {
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

  try {
    const client = getAdminClient();
    if (client) {
      const { data, error } = await client
        .from('app_promo_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        return NextResponse.json({ codes: data });
      }
    }

    const fbCodes = await getFallbackJson<any[]>(FALLBACK_PROMO_KEY, []);
    return NextResponse.json({ codes: Array.isArray(fbCodes) ? fbCodes : [] });
  } catch {
    const fbCodes = await getFallbackJson<any[]>(FALLBACK_PROMO_KEY, []);
    return NextResponse.json({ codes: Array.isArray(fbCodes) ? fbCodes : [] });
  }
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
    const body = await req.json();
    const { code, reward_amount, max_uses, expires_at } = body;
    if (!code || typeof code !== 'string' || !code.trim()) {
      return NextResponse.json({ error: 'コードが必要です' }, { status: 400 });
    }

    const cleanCode = code.trim();
    const reward = Math.max(1, Number(reward_amount) || 1);

    const client = getAdminClient();
    if (client) {
      const { data, error } = await client
        .from('app_promo_codes')
        .insert({
          code: cleanCode,
          reward_amount: reward,
        })
        .select()
        .single();

      if (!error && data) {
        return NextResponse.json({ success: true, promoCode: data });
      }
    }

    // Fallback to admin_config when standalone promo_codes / app_promo_codes table does not exist
    const fbCodes = await getFallbackJson<any[]>(FALLBACK_PROMO_KEY, []);
    const list = Array.isArray(fbCodes) ? fbCodes : [];
    if (list.some((c: any) => String(c?.code || '').toUpperCase() === cleanCode.toUpperCase())) {
      return NextResponse.json({ error: '既に同じコードが登録されています' }, { status: 400 });
    }

    const created = {
      id: crypto.randomUUID(),
      code: cleanCode,
      reward_amount: reward,
      current_uses: 0,
      max_uses: max_uses ?? null,
      expires_at: expires_at ?? null,
      created_at: new Date().toISOString(),
    };
    list.unshift(created);
    await setFallbackJson(FALLBACK_PROMO_KEY, list);

    return NextResponse.json({ success: true, promoCode: created });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || '発行に失敗しました' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
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

  const id = new URL(req.url).searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'id が必要です' }, { status: 400 });
  }

  const client = getAdminClient();
  if (client) {
    const { error } = await client.from('app_promo_codes').delete().eq('id', id);
    if (!error) {
      return NextResponse.json({ success: true });
    }
  }

  const fbCodes = await getFallbackJson<any[]>(FALLBACK_PROMO_KEY, []);
  const filtered = (Array.isArray(fbCodes) ? fbCodes : []).filter(
    (c: any) => c.id !== id && c.code !== id
  );
  await setFallbackJson(FALLBACK_PROMO_KEY, filtered);
  return NextResponse.json({ success: true });
}
