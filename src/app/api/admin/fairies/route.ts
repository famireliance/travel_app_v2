import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/adminAuth';
import { getFallbackJson, setFallbackJson } from '@/lib/adminConfigFallback';

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

  // DBテーブル未作成時は FAIRIES_MASTER + fallback_fairies にフォールバック
  try {
    const [{ FAIRIES_MASTER }, customState] = await Promise.all([
      import('@/lib/fairies'),
      getFallbackJson<{ added: any[]; updated: Record<string, any>; deleted: string[] }>('fallback_fairies', { added: [], updated: {}, deleted: [] })
    ]);

    const deletedSet = new Set(customState.deleted || []);
    const baseFormatted = FAIRIES_MASTER
      .filter(f => !deletedSet.has(f.id))
      .map(f => {
        const ov = customState.updated?.[f.id] || {};
        return {
          id: f.id,
          fairy_key: f.id,
          name: ov.name ?? f.name,
          theme: ov.theme ?? f.theme,
          island_id: ov.island_id ?? (f.island_id || ''),
          region_id: ov.region_id ?? (f.region_id || ''),
          rarity: ov.rarity ?? f.rarity,
          attribute: ov.attribute ?? f.attribute,
          icon: ov.icon ?? f.visual.icon,
          image_url: ov.image_url ?? ov.custom_photo_url ?? (f.visual.imageUrl || ''),
          custom_photo_url: ov.custom_photo_url ?? ov.image_url ?? (f.visual.imageUrl || ''),
          description: ov.description ?? f.description,
          color_from: ov.color_from ?? f.visual.colorFrom,
          color_to: ov.color_to ?? f.visual.colorTo,
          shadow_color: ov.shadow_color ?? f.visual.shadowColor,
          sparkle_color: ov.sparkle_color ?? f.visual.sparkleColor,
        };
      });

    const addedList = (customState.added || []).filter((f: any) => !deletedSet.has(f.id));
    let combined = [...addedList, ...baseFormatted];

    if (search) {
      const q = search.toLowerCase();
      combined = combined.filter(f =>
        (f.name || '').toLowerCase().includes(q) ||
        (f.theme || '').toLowerCase().includes(q) ||
        (f.island_id && f.island_id.toLowerCase().includes(q))
      );
    }

    return NextResponse.json({ data: combined, count: combined.length });
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

    if (error) {
      const customState = await getFallbackJson<{ added: any[]; updated: Record<string, any>; deleted: string[] }>('fallback_fairies', { added: [], updated: {}, deleted: [] });
      const newFairy = {
        id: body.id || body.fairy_key || `fairy_${Date.now()}`,
        fairy_key: body.fairy_key || body.id || `fairy_${Date.now()}`,
        ...body,
        created_at: new Date().toISOString()
      };
      customState.added = [newFairy, ...(customState.added || [])];
      await setFallbackJson('fallback_fairies', customState);
      return NextResponse.json({ message: '妖精データを追加しました', data: newFairy });
    }

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

    if (error) {
      const customState = await getFallbackJson<{ added: any[]; updated: Record<string, any>; deleted: string[] }>('fallback_fairies', { added: [], updated: {}, deleted: [] });
      const addedIdx = (customState.added || []).findIndex((f: any) => f.id === id);
      if (addedIdx !== -1) {
        customState.added[addedIdx] = { ...customState.added[addedIdx], ...updates };
      } else {
        customState.updated = customState.updated || {};
        customState.updated[id] = { ...(customState.updated[id] || {}), ...updates };
      }
      await setFallbackJson('fallback_fairies', customState);
      return NextResponse.json({ message: '妖精データを更新しました', data: { id, ...updates } });
    }

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

    if (error) {
      const customState = await getFallbackJson<{ added: any[]; updated: Record<string, any>; deleted: string[] }>('fallback_fairies', { added: [], updated: {}, deleted: [] });
      customState.added = (customState.added || []).filter((f: any) => f.id !== id);
      customState.deleted = Array.from(new Set([...(customState.deleted || []), id]));
      await setFallbackJson('fallback_fairies', customState);
      return NextResponse.json({ message: '妖精データを削除しました' });
    }

    return NextResponse.json({ message: '妖精データを削除しました' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
