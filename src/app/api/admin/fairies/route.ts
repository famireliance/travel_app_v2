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

interface FallbackFairiesState {
  added: any[];
  updated: Record<string, any>;
  deleted: string[];
}

async function loadFallbackFairiesState(): Promise<FallbackFairiesState> {
  const raw = await getFallbackJson<any>('fallback_fairies', { added: [], updated: {}, deleted: [] });
  if (Array.isArray(raw)) {
    return { added: raw, updated: {}, deleted: [] };
  }
  return {
    added: Array.isArray(raw?.added) ? raw.added : [],
    updated: raw?.updated && typeof raw.updated === 'object' ? raw.updated : {},
    deleted: Array.isArray(raw?.deleted) ? raw.deleted : [],
  };
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
    if (!error && Array.isArray(data) && data.length > 0) {
      return NextResponse.json({ data, count });
    }
  } catch {
    // standalone fairies table does not exist — fallback below
  }

  // DBテーブル未作成時は FAIRIES_MASTER + fallback_fairies にフォールバック
  try {
    const [{ FAIRIES_MASTER }, customState] = await Promise.all([
      import('@/lib/fairies'),
      loadFallbackFairiesState()
    ]);

    const deletedSet = new Set(customState.deleted || []);
    const baseFormatted = FAIRIES_MASTER
      .filter(f => !deletedSet.has(f.id))
      .map(f => {
        const ov = customState.updated?.[f.id] || {};
        const photoUrl = ov.custom_photo_url ?? ov.image_url ?? (f.visual.imageUrl || '');
        return {
          ...ov,
          id: f.id,
          fairy_key: ov.fairy_key ?? f.id,
          name: ov.name ?? f.name,
          theme: ov.theme ?? f.theme,
          island_id: ov.island_id ?? (f.island_id || ''),
          region_id: ov.region_id ?? (f.region_id || ''),
          rarity: ov.rarity ?? f.rarity,
          attribute: ov.attribute ?? f.attribute,
          collab_sponsor: ov.collab_sponsor ?? '',
          icon: ov.icon ?? f.visual.icon,
          image_url: ov.image_url ?? photoUrl,
          custom_photo_url: ov.custom_photo_url ?? photoUrl,
          description: ov.description ?? f.description,
          color_from: ov.color_from ?? f.visual.colorFrom,
          color_to: ov.color_to ?? f.visual.colorTo,
          shadow_color: ov.shadow_color ?? f.visual.shadowColor,
          sparkle_color: ov.sparkle_color ?? f.visual.sparkleColor,
          is_time_limited: ov.is_time_limited ?? false,
          start_date: ov.start_date ?? '',
          end_date: ov.end_date ?? '',
          checkin_radius_m: ov.checkin_radius_m ?? 0,
          is_qr_exclusive: ov.is_qr_exclusive ?? false,
        };
      });

    const addedList = (customState.added || [])
      .filter((f: any) => f && !deletedSet.has(f.id) && !deletedSet.has(f.fairy_key))
      .map((f: any) => {
        const fid = f.id || f.fairy_key;
        const ov = (fid && customState.updated?.[fid]) || {};
        const merged = { ...f, ...ov };
        const photoUrl = merged.custom_photo_url || merged.image_url || '';
        return {
          ...merged,
          id: fid,
          fairy_key: merged.fairy_key || fid,
          image_url: merged.image_url || photoUrl,
          custom_photo_url: merged.custom_photo_url || photoUrl,
        };
      });

    let combined = [...addedList, ...baseFormatted];

    if (search) {
      const q = search.toLowerCase();
      combined = combined.filter(f =>
        (f.name || '').toLowerCase().includes(q) ||
        (f.theme || '').toLowerCase().includes(q) ||
        (f.fairy_key || '').toLowerCase().includes(q) ||
        (f.description || '').toLowerCase().includes(q) ||
        (f.island_id && String(f.island_id).toLowerCase().includes(q))
      );
    }

    return NextResponse.json({ data: combined, count: combined.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
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
      const customState = await loadFallbackFairiesState();
      const resolvedId = String(body.id || body.fairy_key || `fairy_${Date.now()}`);
      const resolvedKey = String(body.fairy_key || resolvedId);
      const newFairy = {
        ...body,
        id: resolvedId,
        fairy_key: resolvedKey,
        image_url: body.image_url || body.custom_photo_url || '',
        custom_photo_url: body.custom_photo_url || body.image_url || '',
        created_at: new Date().toISOString(),
      };
      customState.deleted = (customState.deleted || []).filter((d) => d !== resolvedId && d !== resolvedKey);
      customState.added = [
        newFairy,
        ...(customState.added || []).filter((f: any) => f.id !== resolvedId && f.fairy_key !== resolvedKey),
      ];
      await setFallbackJson('fallback_fairies', customState);
      return NextResponse.json({ message: '妖精データを追加しました', data: newFairy });
    }

    return NextResponse.json({ message: '妖精データを追加しました', data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }
  if (user.role === 'viewer') {
    return NextResponse.json({ error: '閲覧専用アカウントのため変更操作はできません' }, { status: 403 });
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
      const customState = await loadFallbackFairiesState();
      const addedIdx = (customState.added || []).findIndex(
        (f: any) => f.id === id || f.fairy_key === id
      );
      if (addedIdx !== -1) {
        customState.added[addedIdx] = {
          ...customState.added[addedIdx],
          ...updates,
          id: customState.added[addedIdx].id || id,
          updated_at: new Date().toISOString(),
        };
      } else {
        customState.updated = customState.updated || {};
        customState.updated[id] = {
          ...(customState.updated[id] || {}),
          ...updates,
          updated_at: new Date().toISOString(),
        };
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
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }
  if (user.role === 'viewer') {
    return NextResponse.json({ error: '閲覧専用アカウントのため変更操作はできません' }, { status: 403 });
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
      const customState = await loadFallbackFairiesState();
      customState.added = (customState.added || []).filter(
        (f: any) => f.id !== id && f.fairy_key !== id
      );
      customState.deleted = Array.from(new Set([...(customState.deleted || []), id]));
      await setFallbackJson('fallback_fairies', customState);
      return NextResponse.json({ message: '妖精データを削除しました' });
    }

    return NextResponse.json({ message: '妖精データを削除しました' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
