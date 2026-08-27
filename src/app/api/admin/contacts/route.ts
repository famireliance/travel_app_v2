import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAdminPassword } from '@/lib/adminAuth';

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

const VALID_STATUSES = ['unread', 'in_progress', 'resolved'];

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
    const { data: contacts, error } = await adminClient
      .from('contacts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[contacts GET]', error);
      return NextResponse.json({ error: 'お問い合わせの取得に失敗しました' }, { status: 500 });
    }
    return NextResponse.json({ contacts });
  } catch (err: any) {
    console.error('[contacts GET]', err);
    return NextResponse.json({ error: '内部エラーが発生しました' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!await verifyAuth(req)) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, status, admin_note, reply_text } = body;

    if (!id) {
      return NextResponse.json({ error: '必須項目が不足しています' }, { status: 400 });
    }
    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: '無効なステータスです' }, { status: 400 });
    }

    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const updateData: any = { updated_at: new Date().toISOString() };
    if (status) updateData.status = status;
    if (admin_note !== undefined) updateData.admin_note = admin_note;
    if (reply_text !== undefined) updateData.reply_text = reply_text;

    const { error } = await adminClient
      .from('contacts')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('[contacts PUT]', error);
      return NextResponse.json({ error: 'お問い合わせの更新に失敗しました' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'お問い合わせ対応状況を更新しました' });
  } catch (err: any) {
    console.error('[contacts PUT]', err);
    return NextResponse.json({ error: '内部エラーが発生しました' }, { status: 500 });
  }
}
