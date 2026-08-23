import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const adminPassword = request.headers.get('x-admin-password');
  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    let query = supabase.from('fairies').select('*', { count: 'exact' }).order('created_at', { ascending: false });

    if (search) {
      query = query.or(`name.ilike.%${search}%,theme.ilike.%${search}%,fairy_key.ilike.%${search}%`);
    }

    const { data, count, error } = await query;

    if (error) throw error;

    return NextResponse.json({ data, count });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const adminPassword = request.headers.get('x-admin-password');
  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const body = await request.json();
    const { data, error } = await supabase
      .from('fairies')
      .insert([body])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ message: '妖精データを追加しました', data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const adminPassword = request.headers.get('x-admin-password');
  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: '更新対象のIDが必要です' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('fairies')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ message: '妖精データを更新しました', data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const adminPassword = request.headers.get('x-admin-password');
  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: '削除対象のIDが必要です' }, { status: 400 });
    }

    const { error } = await supabase
      .from('fairies')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ message: '妖精データを削除しました' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
