import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAdminPassword } from '@/lib/adminAuth';

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

export async function GET(req: NextRequest) {
  const ADMIN_PASSWORD = await getAdminPassword();
  const auth = req.headers.get('x-admin-password');
  if (!auth || auth !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const { data: orders, error } = await adminClient
    .from('physical_orders')
    .select('*')
    .order('ordered_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ orders });
}

export async function PUT(req: NextRequest) {
  const ADMIN_PASSWORD = await getAdminPassword();
  const auth = req.headers.get('x-admin-password');
  if (!auth || auth !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const body = await req.json();

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  // 一括更新の場合
  if (Array.isArray(body.ids) && body.status) {
    const { ids, status, carrier } = body;
    const updateData: any = { status };
    if (status === 'shipped') updateData.shipped_at = new Date().toISOString();
    if (status === 'delivered') updateData.delivered_at = new Date().toISOString();
    if (carrier) updateData.carrier = carrier;

    const { error } = await adminClient
      .from('physical_orders')
      .update(updateData)
      .in('id', ids);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, message: `${ids.length}件の注文ステータスを更新しました` });
  }

  // 単一更新の場合
  const { id, status, tracking_number, carrier, notes } = body;
  if (!id || !status) {
    return NextResponse.json({ error: '必須項目が不足しています' }, { status: 400 });
  }

  const updateData: any = { status };
  if (status === 'shipped') updateData.shipped_at = new Date().toISOString();
  if (status === 'delivered') updateData.delivered_at = new Date().toISOString();
  if (tracking_number !== undefined) updateData.tracking_number = tracking_number;
  if (carrier !== undefined) updateData.carrier = carrier;
  if (notes !== undefined) updateData.notes = notes;

  const { error } = await adminClient
    .from('physical_orders')
    .update(updateData)
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: '注文ステータス・発送情報を更新しました' });
}
