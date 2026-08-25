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
      // テーブルが未作成の場合は空配列を返却
      return NextResponse.json({ stores: [] });
    }

    return NextResponse.json({ stores: stores || [] });
  } catch (err: any) {
    return NextResponse.json({ stores: [] });
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

    const islandSlug = island_id.toLowerCase().replace(/[^a-z0-9]/g, '');
    const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    const referral_code = `STORE-${islandSlug.slice(0, 4).toUpperCase()}-${randomSuffix}`;

    const storeData = {
      shop_name,
      island_id,
      referral_code,
      commission_rate: Number(commission_rate),
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
