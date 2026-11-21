import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/adminAuth';
import { getFallbackJson, setFallbackJson } from '@/lib/adminConfigFallback';

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

const VALID_STATUSES = ['unread', 'in_progress', 'resolved'];

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
    const { data: contacts, error } = await adminClient
      .from('contacts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      const fbContacts = await getFallbackJson<any[]>('fallback_contacts', []);
      return NextResponse.json({ contacts: Array.isArray(fbContacts) ? fbContacts : [] });
    }
    return NextResponse.json({ contacts: contacts || [] });
  } catch (err: any) {
    console.error('[contacts GET]', err);
    const fbContacts = await getFallbackJson<any[]>('fallback_contacts', []);
    return NextResponse.json({ contacts: Array.isArray(fbContacts) ? fbContacts : [] });
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

  try {
    const body = await req.json();
    const { name, email, category, message } = body;
    if (!name || !email || !message) {
      return NextResponse.json({ error: '必須項目が不足しています' }, { status: 400 });
    }

    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const record = {
      id: crypto.randomUUID(),
      name: String(name).trim(),
      email: String(email).trim(),
      category: category || 'general',
      message: String(message).trim(),
      status: 'unread',
      created_at: new Date().toISOString(),
    };

    const { data, error } = await adminClient
      .from('contacts')
      .insert([record])
      .select()
      .single();

    if (error) {
      const fbContacts = await getFallbackJson<any[]>('fallback_contacts', []);
      const list = Array.isArray(fbContacts) ? fbContacts : [];
      list.unshift(record);
      await setFallbackJson('fallback_contacts', list);
      return NextResponse.json({ success: true, contact: record });
    }

    return NextResponse.json({ success: true, contact: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || '登録に失敗しました' }, { status: 500 });
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
      // Fallback to admin_config storage
      const fbContacts = await getFallbackJson<any[]>('fallback_contacts', []);
      const list = Array.isArray(fbContacts) ? fbContacts : [];
      const idx = list.findIndex((c: any) => String(c.id) === String(id));
      if (idx === -1) {
        return NextResponse.json({ error: '対象のお問い合わせが見つかりません' }, { status: 404 });
      }
      list[idx] = { ...list[idx], ...updateData };
      await setFallbackJson('fallback_contacts', list);
    }

    return NextResponse.json({ success: true, message: 'お問い合わせ対応状況を更新しました' });
  } catch (err: any) {
    console.error('[contacts PUT]', err);
    return NextResponse.json({ error: '内部エラーが発生しました' }, { status: 500 });
  }
}
