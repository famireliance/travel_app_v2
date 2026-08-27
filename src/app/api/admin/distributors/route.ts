import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAdminPassword } from '@/lib/adminAuth';

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

async function verifyAuth(req: NextRequest) {
  const ADMIN_PASSWORD = await getAdminPassword();
  const auth = req.headers.get('x-admin-password');
  return auth && auth === ADMIN_PASSWORD;
}

export async function GET(req: NextRequest) {
  if (!await verifyAuth(req)) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    const { data: stores, error } = await adminClient
      .from('distributor_stores')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      // マイグレーション未適用の場合は空配列を返却（本番環境ではエラーを返却）
      console.error('[distributors GET]', error);
      return NextResponse.json({ stores: [] });
    }

    return NextResponse.json({ stores: stores || [] });
  } catch (err: any) {
    console.error('[distributors GET]', err);
    return NextResponse.json({ error: err.message || '加盟店データの取得に失敗しました' }, { status: 500 });
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
      shop_name,
      island_id,
      commission_rate = 15,
      contact_person,
      email,
      phone
    } = body;

    if (!shop_name || !island_id) {
      return NextResponse.json({ error: '店舗名と対象島IDが必要です' }, { status: 400 });
    }

    const rate = Number(commission_rate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      return NextResponse.json({ error: '手数料率は0～100%の間で指定してください' }, { status: 400 });
    }

    const islandSlug = island_id.toLowerCase().replace(/[^a-z0-9]/g, '');
    // crypto で充分なランダム性を持たせる
    const randomSuffix = Array.from(crypto.getRandomValues(new Uint8Array(3)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
    const referral_code = `STORE-${islandSlug.slice(0, 4).toUpperCase()}-${randomSuffix}`;

    const storeData = {
      shop_name,
      island_id,
      referral_code,
      commission_rate: rate,
      contact_person: contact_person || '',
      email: email || '',
      phone: phone || '',
      total_sales_count: 0,
      total_revenue: 0,
      accumulated_commission: 0,
      created_at: new Date().toISOString()
    };

    const { data, error } = await adminClient
      .from('distributor_stores')
      .insert([storeData])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: `販売協力店「${shop_name}」を登録しました（店舗専用紹介コード: ${referral_code}）`,
      store: data
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || '登録に失敗しました' }, { status: 500 });
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
    const { id, ...rawUpdates } = body;
    if (!id) return NextResponse.json({ error: 'id が必要です' }, { status: 400 });

    const allowed = ['shop_name', 'island_id', 'commission_rate', 'contact_person', 'email', 'phone', 'is_active'];
    const updates: Record<string, any> = {};
    for (const key of allowed) {
      if (rawUpdates[key] !== undefined) updates[key] = rawUpdates[key];
    }
    if (updates.commission_rate !== undefined) {
      const rate = Number(updates.commission_rate);
      if (isNaN(rate) || rate < 0 || rate > 100) {
        return NextResponse.json({ error: '手数料率は0～100%の間で指定してください' }, { status: 400 });
      }
      updates.commission_rate = rate;
    }
    updates.updated_at = new Date().toISOString();

    const { data, error } = await adminClient
      .from('distributor_stores')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, message: '店舗情報を更新しました', store: data });
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
    if (!id) return NextResponse.json({ error: 'id が必要です' }, { status: 400 });

    const { error } = await adminClient
      .from('distributor_stores')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true, message: '店舗を削除しました' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || '削除に失敗しました' }, { status: 500 });
  }
}
