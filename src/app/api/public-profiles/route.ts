import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_IDS = 100;

export async function GET(req: NextRequest) {
  try {
    const rawIds = req.nextUrl.searchParams.get('ids') || '';
    if (!rawIds.trim()) {
      return NextResponse.json({ profiles: {} });
    }

    const validIds = Array.from(
      new Set(
        rawIds
          .split(',')
          .map((s) => s.trim())
          .filter((s) => UUID_REGEX.test(s))
      )
    ).slice(0, MAX_IDS);

    if (validIds.length === 0) {
      return NextResponse.json({ profiles: {} });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey || serviceRoleKey.startsWith('REPLACE')) {
      return NextResponse.json({ profiles: {} });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data, error } = await adminClient
      .from('user_profiles')
      .select('id, nickname')
      .in('id', validIds)
      .is('deleted_at', null);

    let rows = !error && Array.isArray(data) ? data : null;
    if (!rows && error) {
      const fallbackRes = await adminClient
        .from('user_profiles')
        .select('id, nickname')
        .in('id', validIds);
      rows = Array.isArray(fallbackRes.data) ? fallbackRes.data : [];
    }

    const profiles: Record<string, { nickname: string }> = {};
    for (const row of rows || []) {
      if (!row?.id) continue;
      profiles[String(row.id)] = {
        nickname: typeof row.nickname === 'string' ? row.nickname : '',
      };
    }

    return NextResponse.json({ profiles });
  } catch {
    return NextResponse.json({ profiles: {} });
  }
}
