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

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    const { data: partners, error } = await adminClient
      .from('b2b_partners')
      .select('*')
      .order('contract_end', { ascending: true });

    if (error) {
      const fbPartners = await getFallbackJson<any[]>('fallback_b2b_partners', []);
      return NextResponse.json({ partners: fbPartners });
    }

    return NextResponse.json({ partners: partners || [] });
  } catch (err: any) {
    const fbPartners = await getFallbackJson<any[]>('fallback_b2b_partners', []);
    return NextResponse.json({ partners: fbPartners });
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
    } = body;

    if (!name || !island_id || !type) {
      return NextResponse.json({ error: 'パートナー名、対象島ID、業種種別は必須です' }, { status: 400 });
    }
    if (!['transport', 'lodging'].includes(type)) {
      return NextResponse.json({ error: '業種種別は transport または lodging を指定してください' }, { status: 400 });
    }
    if (sponsor_tier && !['GOLD', 'SILVER', 'STANDARD'].includes(sponsor_tier)) {
      return NextResponse.json({ error: 'スポンサーランクが無効です' }, { status: 400 });
    }

    const partnerData = {
      name,
      type,
      category_detail: category_detail || (type === 'transport' ? '交通機関' : '宿泊施設'),
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
  if (!await verifyAuth(req)) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    const body = await req.json();
    const { id, extendDays, ...rawUpdates } = body;

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

    if (updates.type && !['transport', 'lodging'].includes(updates.type)) {
      return NextResponse.json({ error: '業種種別が無効です' }, { status: 400 });
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
      return NextResponse.json({ error: 'id が必要です' }, { status: 400 });
    }

    const { error } = await adminClient
      .from('b2b_partners')
      .delete()
      .eq('id', id);

    if (error) {
      const fbPartners = await getFallbackJson<any[]>('fallback_b2b_partners', []);
      const filtered = fbPartners.filter((p: any) => p.id !== id);
      await setFallbackJson('fallback_b2b_partners', filtered);
    }

    return NextResponse.json({ success: true, message: 'パートナーデータを削除しました' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || '削除に失敗しました' }, { status: 500 });
  }
}
