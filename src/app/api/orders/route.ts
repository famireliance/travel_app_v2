import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(req: NextRequest) {
  try {
    const anonClient = createClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(
      req.headers.get('authorization')?.replace('Bearer ', '') || ''
    );
    if (authError || !user) {
      return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 });
    }

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: orders, error } = await adminClient
      .from('physical_orders')
      .select('*')
      .eq('user_id', user.id)
      .order('ordered_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: '注文の取得に失敗しました' }, { status: 500 });
    }

    return NextResponse.json({ orders });
  } catch (err) {
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const anonClient = createClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(
      req.headers.get('authorization')?.replace('Bearer ', '') || ''
    );
    if (authError || !user) {
      return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 });
    }

    const body = await req.json();
    const { id, shipping_name, shipping_postal_code, shipping_address, shipping_phone } = body;

    if (!id || !shipping_name || !shipping_postal_code || !shipping_address) {
      return NextResponse.json({ error: '必須項目が入力されていません' }, { status: 400 });
    }

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 自分の注文で、かつ発送前か確認
    const { data: existingOrder } = await adminClient
      .from('physical_orders')
      .select('status, user_id')
      .eq('id', id)
      .single();

    if (!existingOrder || existingOrder.user_id !== user.id) {
      return NextResponse.json({ error: '注文が見つかりません' }, { status: 404 });
    }

    if (existingOrder.status === 'shipped' || existingOrder.status === 'delivered') {
      return NextResponse.json({ error: 'すでに発送済みのため変更できません' }, { status: 400 });
    }

    const { error: updateError } = await adminClient
      .from('physical_orders')
      .update({
        shipping_name,
        shipping_postal_code,
        shipping_address,
        shipping_phone
      })
      .eq('id', id);

    if (updateError) {
      return NextResponse.json({ error: '更新に失敗しました' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: '配送先情報を更新しました' });
  } catch (err) {
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}
