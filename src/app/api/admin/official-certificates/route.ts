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

// 公的証明書の設定を取得・更新・販売期間延長を行うAPI
export async function GET(req: NextRequest) {
  if (!await verifyAuth(req)) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const { searchParams } = new URL(req.url);
  const islandId = searchParams.get('islandId');

  try {
    let query = adminClient.from('islands').select('id, name, prefecture, official_cert_enabled, official_org_name, official_seal_url, official_cert_price, official_sales_start_at, official_sales_end_at, official_template_id');

    if (islandId) {
      query = query.eq('id', islandId);
    }

    const { data: islands, error } = await query;
    if (error) throw error;

    return NextResponse.json({ islands: islands || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || '取得に失敗しました' }, { status: 500 });
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
    const {
      islandId,
      official_cert_enabled,
      official_org_name,
      official_seal_url,
      official_cert_price,
      official_sales_start_at,
      official_sales_end_at,
      official_template_id,
      extendDays // 30, 90, 180, 365, or custom number
    } = body;

    if (!islandId) {
      return NextResponse.json({ error: 'islandId が必要です' }, { status: 400 });
    }

    const updateData: Record<string, any> = {};

    if (official_cert_enabled !== undefined) updateData.official_cert_enabled = official_cert_enabled;
    if (official_org_name !== undefined) updateData.official_org_name = official_org_name;
    if (official_seal_url !== undefined) updateData.official_seal_url = official_seal_url;
    if (official_cert_price !== undefined) updateData.official_cert_price = Number(official_cert_price);
    if (official_sales_start_at !== undefined) updateData.official_sales_start_at = official_sales_start_at;
    if (official_template_id !== undefined) updateData.official_template_id = official_template_id;

    // 期間延長処理 (30日, 90日, 180日, 365日, または任意日数)
    if (extendDays && typeof extendDays === 'number') {
      const currentEnd = official_sales_end_at ? new Date(official_sales_end_at) : new Date();
      const baseDate = currentEnd.getTime() < Date.now() ? new Date() : currentEnd;
      baseDate.setDate(baseDate.getDate() + extendDays);
      updateData.official_sales_end_at = baseDate.toISOString();
    } else if (official_sales_end_at !== undefined) {
      updateData.official_sales_end_at = official_sales_end_at;
    }

    const { data: updatedIsland, error } = await adminClient
      .from('islands')
      .update(updateData)
      .eq('id', islandId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: `「${updatedIsland.name}」の公的証明書設定を更新しました（販売終了: ${updatedIsland.official_sales_end_at ? new Date(updatedIsland.official_sales_end_at).toLocaleDateString('ja-JP') : '無制限'}）`,
      island: updatedIsland
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || '更新に失敗しました' }, { status: 500 });
  }
}
