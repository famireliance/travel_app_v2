import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/adminAuth';

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

async function verifyAuth(req: NextRequest) {
  const user = await getAuthUser(req);
  return !!user;
}

function parseDifficultyInt(val: unknown): { difficulty: number; difficulty_name: string } {
  if (typeof val === 'number' && !isNaN(val)) {
    const names: Record<number, string> = { 1: '初級', 2: '中級', 3: '上級', 4: '超上級', 5: '秘境' };
    return { difficulty: val, difficulty_name: names[val] || '中級' };
  }
  const str = String(val || '中級');
  if (str.includes('初級') || str === '1') return { difficulty: 1, difficulty_name: '初級' };
  if (str.includes('超上級') || str === '4') return { difficulty: 4, difficulty_name: '超上級' };
  if (str.includes('上級') || str === '3') return { difficulty: 3, difficulty_name: '上級' };
  if (str.includes('秘境') || str === '5') return { difficulty: 5, difficulty_name: '秘境' };
  return { difficulty: 2, difficulty_name: '中級' };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeIslandRowForAdmin(row: any) {
  const practical = row?.practical_info && typeof row.practical_info === 'object' ? row.practical_info : {};
  const heroDesktop = row?.hero_image_url || practical.hero_image_url || '';
  const heroMobile = practical.hero_image_mobile_url || '';
  const galleryUrls = Array.isArray(practical.gallery_urls) ? practical.gallery_urls : [];
  const focalPoint = practical.photo_focal_point || '50% 50%';
  const mobileDisplayMode = practical.mobile_display_mode || 'contain_blur';
  const photoCaption = practical.photo_caption || '';

  return {
    ...row,
    hero_image_url: heroDesktop,
    thumbnail_url: heroDesktop,
    hero_image_mobile_url: heroMobile,
    gallery_urls: galleryUrls,
    photo_focal_point: focalPoint,
    mobile_display_mode: mobileDisplayMode,
    photo_caption: photoCaption,
    difficulty: row?.difficulty_name || parseDifficultyInt(row?.difficulty).difficulty_name,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildDbPayload(body: any, existingPractical: Record<string, any> = {}) {
  const heroDesktop =
    body.hero_image_url !== undefined
      ? String(body.hero_image_url || '').trim()
      : body.thumbnail_url !== undefined
        ? String(body.thumbnail_url || '').trim()
        : undefined;

  const heroMobile =
    body.hero_image_mobile_url !== undefined
      ? String(body.hero_image_mobile_url || '').trim()
      : existingPractical.hero_image_mobile_url || '';

  const galleryUrls = Array.isArray(body.gallery_urls)
    ? body.gallery_urls.filter((u: unknown) => typeof u === 'string' && u.trim() !== '')
    : Array.isArray(existingPractical.gallery_urls)
      ? existingPractical.gallery_urls
      : [];

  const focalPoint =
    typeof body.photo_focal_point === 'string' && body.photo_focal_point.trim() !== ''
      ? body.photo_focal_point.trim()
      : existingPractical.photo_focal_point || '50% 50%';

  const mobileDisplayMode =
    body.mobile_display_mode === 'cover' || body.mobile_display_mode === 'contain_blur'
      ? body.mobile_display_mode
      : existingPractical.mobile_display_mode || 'contain_blur';

  const photoCaption =
    body.photo_caption !== undefined
      ? String(body.photo_caption || '').trim()
      : existingPractical.photo_caption || '';

  const mergedPractical = {
    ...existingPractical,
    ...(body.practical_info && typeof body.practical_info === 'object' ? body.practical_info : {}),
    hero_image_mobile_url: heroMobile,
    gallery_urls: galleryUrls,
    photo_focal_point: focalPoint,
    mobile_display_mode: mobileDisplayMode,
    photo_caption: photoCaption,
    is_verified_local_photo: Boolean(heroDesktop || heroMobile || galleryUrls.length > 0),
  };

  const diffObj = parseDifficultyInt(body.difficulty);

  // public.islands に実在するカラムのみを厳選して構築
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload: Record<string, any> = {
    practical_info: mergedPractical,
  };

  if (body.name !== undefined) payload.name = body.name;
  if (body.region_id !== undefined) payload.region_id = body.region_id;
  if (body.prefecture !== undefined) payload.prefecture = body.prefecture;
  if (body.coordinates !== undefined) payload.coordinates = body.coordinates;
  if (body.description !== undefined) payload.description = body.description;
  if (body.access !== undefined) payload.access = body.access;
  if (body.difficulty !== undefined) {
    payload.difficulty = diffObj.difficulty;
    payload.difficulty_name = diffObj.difficulty_name;
  }
  if (body.points !== undefined) payload.points = Number(body.points) || 10;
  if (body.checkin_radius_m !== undefined) payload.checkin_radius_m = Number(body.checkin_radius_m) || 3000;
  if (heroDesktop !== undefined) payload.hero_image_url = heroDesktop;
  if (body.is_published !== undefined) payload.is_published = Boolean(body.is_published);
  if (body.is_featured !== undefined) payload.is_featured = Boolean(body.is_featured);
  if (body.slug !== undefined) payload.slug = body.slug;

  return payload;
}

export async function GET(req: NextRequest) {
  if (!await verifyAuth(req)) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '500');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search') || '';

    let query = adminClient.from('islands').select('*', { count: 'exact' });

    if (search) {
      query = query.or(`name.ilike.%${search}%,prefecture.ilike.%${search}%,region_id.ilike.%${search}%`);
    }

    const { data, count, error } = await query
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const normalized = (data || []).map(normalizeIslandRowForAdmin);
    return NextResponse.json({ data: normalized, count });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
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
    const insertPayload = {
      id: body.id || `island_${Date.now()}`,
      ...buildDbPayload(body, {}),
    };

    const { data, error } = await adminClient
      .from('islands')
      .insert([insertPayload])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ message: '島データを追加しました', data: normalizeIslandRowForAdmin(data) });
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
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: '更新対象のIDが必要です' }, { status: 400 });
    }

    const { data: existingRow } = await adminClient
      .from('islands')
      .select('practical_info')
      .eq('id', id)
      .single();

    const existingPractical =
      existingRow?.practical_info && typeof existingRow.practical_info === 'object'
        ? existingRow.practical_info
        : {};

    const updatePayload = buildDbPayload(body, existingPractical);

    const { data, error } = await adminClient
      .from('islands')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ message: '島データ・現地写真を保存しました', data: normalizeIslandRowForAdmin(data) });
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
      .from('islands')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ message: '島データを削除しました' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
