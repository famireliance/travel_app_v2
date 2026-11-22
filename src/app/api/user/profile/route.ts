import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getFallbackJson } from '@/lib/adminConfigFallback';

function getAuthToken(request: Request): string {
  const authHeader =
    request.headers.get('Authorization') || request.headers.get('authorization') || '';
  return authHeader.replace(/^Bearer\s+/i, '').trim();
}

export async function GET(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const token = getAuthToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!supabaseUrl || !supabaseServiceKey || supabaseServiceKey.startsWith('REPLACE')) {
      if (supabaseUrl && supabaseAnonKey) {
        const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        });
        const {
          data: { user },
        } = await anonClient.auth.getUser(token);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        return NextResponse.json({ profile: {} });
      }
      return NextResponse.json({ error: 'Server configuration error' }, { status: 503 });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const {
      data: { user },
      error: authError,
    } = await adminClient.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let { data, error } = await adminClient
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error('DB Fetch Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // マジックリンク初回ログイン等で user_profiles 行が未作成の場合は自動初期化する
    if (!data) {
      const initialNickname =
        (typeof user.user_metadata?.nickname === 'string' && user.user_metadata.nickname.trim()) ||
        '名無しの旅人';
      const { data: created } = await adminClient
        .from('user_profiles')
        .upsert(
          {
            id: user.id,
            nickname: initialNickname,
            subscription_tier: 'free',
          },
          { onConflict: 'id' }
        )
        .select('*')
        .maybeSingle();
      if (created) {
        data = created;
      }
    }

    const ultimateMeta = await getFallbackJson<{
      ultimate_started_at?: string | null;
      anniversary_cert_used?: boolean;
    }>(`ultimate_meta_${user.id}`, {});

    const rawTier = data?.subscription_tier ?? 'free';
    const isExpired =
      rawTier !== 'free' &&
      Boolean(data?.premium_until) &&
      new Date(data.premium_until).getTime() < Date.now();
    const effectiveTier = isExpired ? 'free' : rawTier;

    const profile = data
      ? {
          nickname: data.nickname ?? null,
          subscription_tier: effectiveTier,
          premium_until: data.premium_until ?? null,
          ultimate_started_at:
            effectiveTier === 'ultimate'
              ? (ultimateMeta.ultimate_started_at ?? data.ultimate_started_at ?? null)
              : null,
          anniversary_cert_used: Boolean(
            ultimateMeta.anniversary_cert_used ?? data.anniversary_cert_used ?? false
          ),
          high_quality_tickets: data.high_quality_tickets ?? 0,
        }
      : {};

    return NextResponse.json({ profile });
  } catch (err: any) {
    console.error('API Route Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const token = getAuthToken(request);

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!supabaseUrl || !supabaseServiceKey || supabaseServiceKey.startsWith('REPLACE')) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 503 });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const {
      data: { user },
      error: authError,
    } = await adminClient.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const nickname = typeof body?.nickname === 'string' ? body.nickname.trim().slice(0, 40) : '';
    if (!nickname) {
      return NextResponse.json({ error: 'ニックネームを入力してください' }, { status: 400 });
    }

    const { error: upsertErr } = await adminClient
      .from('user_profiles')
      .upsert({ id: user.id, nickname }, { onConflict: 'id' });

    if (upsertErr) {
      return NextResponse.json({ error: upsertErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, nickname });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
