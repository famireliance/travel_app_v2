import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/adminAuth';

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

async function verifyAuth(req: NextRequest) {
  const user = await getAuthUser(req);
  return !!user;
}

export async function GET(req: NextRequest) {
  if (!await verifyAuth(req)) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    let query = adminClient.from('fairies').select('*', { count: 'exact' }).order('created_at', { ascending: false });

    if (search) {
      const cleanSearch = search.replace(/[^a-zA-Z0-9_\-\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\s]/g, '').trim();
      if (cleanSearch) {
        query = query.or(`name.ilike.%${cleanSearch}%,theme.ilike.%${cleanSearch}%,fairy_key.ilike.%${cleanSearch}%`);
      }
    }

    const { data, count, error } = await query;
    if (!error && data && data.length > 0) {
      return NextResponse.json({ data, count });
    }
  } catch {}

  // DBテーブル未作成時は FAIRIES_MASTER にフォールバック
  try {
    const { FAIRIES_MASTER } = await import('@/lib/fairies');
    let filtered = FAIRIES_MASTER;
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(f => 
        f.name.toLowerCase().includes(q) || 
        f.theme.toLowerCase().includes(q) || 
        (f.island_id && f.island_id.includes(q))
      );
    }
    const formatted = filtered.map(f => ({
      id: f.id,
      fairy_key: f.id,
      name: f.name,
      theme: f.theme,
      island_id: f.island_id || '',
      region_id: f.region_id || '',
      rarity: f.rarity,
      attribute: f.attribute,
      icon: f.visual.icon,
      image_url: f.visual.imageUrl || '',
      description: f.description
    }));
    return NextResponse.json({ data: formatted, count: formatted.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!await verifyAuth(req)) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    const body = await req.json();
    const { data, error } = await adminClient
      .from('fairies')
      .insert([body])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ message: '妖精データを追加しました', data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!await verifyAuth(req)) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: '更新対象のIDが必要です' }, { status: 400 });
    }

    const { data, error } = await adminClient
      .from('fairies')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ message: '妖精データを更新しました', data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!await verifyAuth(req)) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: '削除対象のIDが必要です' }, { status: 400 });
    }

    const { error } = await adminClient
      .from('fairies')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ message: '妖精データを削除しました' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
