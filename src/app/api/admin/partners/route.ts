import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/adminAuth';
import { getFallbackJson, setFallbackJson } from '@/lib/adminConfigFallback';

const VALID_PARTNER_TYPES = [
  'transport',
  'lodging',
  'dining',
  'shop',
  'activity',
  'municipality',
] as const;

type PartnerType = (typeof VALID_PARTNER_TYPES)[number];

const DEFAULT_CATEGORY_BY_TYPE: Record<PartnerType, string> = {
  transport: '交通・レンタカー',
  lodging: '宿泊施設',
  dining: '飲食店・カフェ',
  shop: 'お土産・特産店',
  activity: 'マリン・体験',
  municipality: '自治体・観光協会',
};

function isValidPartnerType(val: unknown): val is PartnerType {
  return typeof val === 'string' && (VALID_PARTNER_TYPES as readonly string[]).includes(val);
}

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey || serviceRoleKey.startsWith('REPLACE')) {
    return null;
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

async function verifyAuth(req: NextRequest) {
  const user = await getAuthUser(req);
  return !!user;
}

export async function GET(req: NextRequest) {
  try {
    if (!await verifyAuth(req)) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const adminClient = getAdminClient();
    if (!adminClient) {
      return NextResponse.json({ error: 'サーバー設定エラー' }, { status: 503 });
    }

    const [{ data: partners, error }, fbPartners] = await Promise.all([
      adminClient
        .from('b2b_partners')
        .select('*')
        .order('contract_end', { ascending: true }),
      getFallbackJson<Record<string, unknown>[]>('fallback_b2b_partners', []),
    ]);

    const safeFb = Array.isArray(fbPartners) ? fbPartners : [];
    if (error) {
      const sorted = [...safeFb].sort((a, b) =>
        String(a?.contract_end || '').localeCompare(String(b?.contract_end || ''))
      );
      return NextResponse.json({ partners: sorted });
    }

    const dbList = Array.isArray(partners) ? partners : [];
    const seenIds = new Set(dbList.map((p) => String(p.id)));
    const merged = [...dbList, ...safeFb.filter((p) => p?.id && !seenIds.has(String(p.id)))].sort(
      (a, b) => String(a?.contract_end || '').localeCompare(String(b?.contract_end || ''))
    );

    return NextResponse.json({ partners: merged });
  } catch (err: any) {
    const fbPartners = await getFallbackJson<any[]>('fallback_b2b_partners', []);
    return NextResponse.json({ partners: Array.isArray(fbPartners) ? fbPartners : [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }
    if (user.role === 'viewer') {
      return NextResponse.json({ error: '閲覧専用アカウントのため変更操作はできません' }, { status: 403 });
    }

    const adminClient = getAdminClient();
    if (!adminClient) {
      return NextResponse.json({ error: 'サーバー設定エラー' }, { status: 503 });
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: '不正なリクエスト形式です' }, { status: 400 });
    }
    const {
      name,
      type,
      category_detail,
      island_id,
      logo_url,
      banner_photo_url,
      official_website_url,
      perk_text,
      sponsor_tier = 'STANDARD',
      contract_start,
      contract_end,
      notification_email,
      is_active = true
    } = body || {};

    if (!name || !island_id || !type) {
      return NextResponse.json({ error: 'パートナー名、対象島ID、業種種別は必須です' }, { status: 400 });
    }
    if (!isValidPartnerType(type)) {
      return NextResponse.json(
        { error: '業種種別は transport / lodging / dining / shop / activity / municipality のいずれかを指定してください' },
        { status: 400 }
      );
    }
    if (sponsor_tier && !['GOLD', 'SILVER', 'STANDARD'].includes(sponsor_tier)) {
      return NextResponse.json({ error: 'スポンサーランクが無効です' }, { status: 400 });
    }

    const trimmedCategory = typeof category_detail === 'string' ? category_detail.trim() : '';
    const partnerData = {
      name,
      type,
      category_detail: trimmedCategory || DEFAULT_CATEGORY_BY_TYPE[type],
      island_id,
      logo_url: logo_url || '',
      banner_photo_url: banner_photo_url || '',
      official_website_url: official_website_url || '',
      perk_text: perk_text || '',
      sponsor_tier,
      contract_start: contract_start || new Date().toISOString(),
      contract_end: contract_end || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      notification_email: notification_email || '',
      is_active,
      created_at: new Date().toISOString()
    };

    const { data, error } = await adminClient
      .from('b2b_partners')
      .insert([partnerData])
      .select()
      .single();

    if (error) {
      const fbPartners = await getFallbackJson<any[]>('fallback_b2b_partners', []);
      const created = { id: crypto.randomUUID(), ...partnerData, updated_at: new Date().toISOString() };
      fbPartners.push(created);
      await setFallbackJson('fallback_b2b_partners', fbPartners);
      return NextResponse.json({
        success: true,
        message: `タイアップパートナー「${name}」を登録しました`,
        partner: created
      });
    }

    return NextResponse.json({
      success: true,
      message: `タイアップパートナー「${name}」を登録しました`,
      partner: data
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'パートナー登録に失敗しました' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }
    if (user.role === 'viewer') {
      return NextResponse.json({ error: '閲覧専用アカウントのため変更操作はできません' }, { status: 403 });
    }

    const adminClient = getAdminClient();
    if (!adminClient) {
      return NextResponse.json({ error: 'サーバー設定エラー' }, { status: 503 });
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: '不正なリクエスト形式です' }, { status: 400 });
    }
    const { id, extendDays, ...rawUpdates } = body || {};

    if (!id) {
      return NextResponse.json({ error: 'id が必要です' }, { status: 400 });
    }

    const allowedFields = [
      'name', 'type', 'category_detail', 'island_id', 'logo_url',
      'banner_photo_url', 'official_website_url', 'perk_text',
      'sponsor_tier', 'contract_start', 'contract_end',
      'notification_email', 'is_active'
    ];
    const updates: Record<string, any> = {};
    for (const key of allowedFields) {
      if (rawUpdates[key] !== undefined) updates[key] = rawUpdates[key];
    }

    if (updates.type !== undefined) {
      if (!isValidPartnerType(updates.type)) {
        return NextResponse.json({ error: '業種種別が無効です' }, { status: 400 });
      }
      if (typeof updates.category_detail === 'string' && !updates.category_detail.trim()) {
        updates.category_detail = DEFAULT_CATEGORY_BY_TYPE[updates.type];
      }
    }
    if (updates.sponsor_tier && !['GOLD', 'SILVER', 'STANDARD'].includes(updates.sponsor_tier)) {
      return NextResponse.json({ error: 'スポンサーランクが無効です' }, { status: 400 });
    }

    if (extendDays && typeof extendDays === 'number' && extendDays > 0) {
      const { data: current } = await adminClient
        .from('b2b_partners')
        .select('contract_end')
        .eq('id', id)
        .maybeSingle();
      let currentEndStr = current?.contract_end;
      if (!currentEndStr) {
        const fbPartners = await getFallbackJson<any[]>('fallback_b2b_partners', []);
        currentEndStr = fbPartners.find((p: any) => p.id === id)?.contract_end;
      }
      const currentEnd = currentEndStr ? new Date(currentEndStr) : new Date();
      const baseDate = currentEnd.getTime() < Date.now() ? new Date() : currentEnd;
      baseDate.setDate(baseDate.getDate() + extendDays);
      updates.contract_end = baseDate.toISOString();
    }

    updates.updated_at = new Date().toISOString();

    const { data, error } = await adminClient
      .from('b2b_partners')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      const fbPartners = await getFallbackJson<any[]>('fallback_b2b_partners', []);
      const idx = fbPartners.findIndex((p: any) => p.id === id);
      if (idx === -1) {
        return NextResponse.json({ error: '指定されたパートナーが見つかりません' }, { status: 404 });
      }
      fbPartners[idx] = { ...fbPartners[idx], ...updates };
      await setFallbackJson('fallback_b2b_partners', fbPartners);
      return NextResponse.json({
        success: true,
        message: `パートナー「${fbPartners[idx].name}」の契約・情報を更新しました`,
        partner: fbPartners[idx]
      });
    }

    return NextResponse.json({
      success: true,
      message: `パートナー「${data.name}」の契約・情報を更新しました`,
      partner: data
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || '更新に失敗しました' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }
    if (user.role === 'viewer') {
      return NextResponse.json({ error: '閲覧専用アカウントのため変更操作はできません' }, { status: 403 });
    }

    const adminClient = getAdminClient();
    if (!adminClient) {
      return NextResponse.json({ error: 'サーバー設定エラー' }, { status: 503 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id が必要です' }, { status: 400 });
    }

    await adminClient
      .from('b2b_partners')
      .delete()
      .eq('id', id);

    const fbPartners = await getFallbackJson<Record<string, unknown>[]>('fallback_b2b_partners', []);
    if (Array.isArray(fbPartners) && fbPartners.some((p) => String(p?.id) === id)) {
      const filtered = fbPartners.filter((p) => String(p?.id) !== id);
      await setFallbackJson('fallback_b2b_partners', filtered);
    }

    return NextResponse.json({ success: true, message: 'パートナーデータを削除しました' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || '削除に失敗しました' }, { status: 500 });
  }
}
