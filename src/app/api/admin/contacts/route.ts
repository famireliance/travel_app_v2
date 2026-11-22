import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/adminAuth';
import { getFallbackJson, setFallbackJson } from '@/lib/adminConfigFallback';

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

const VALID_STATUSES = ['unread', 'in_progress', 'resolved', 'replied'];
const STATUS_OVERRIDES_KEY = 'fallback_contact_status_overrides';

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

    const [{ data: contacts, error }, statusOverrides] = await Promise.all([
      adminClient.from('contacts').select('*').order('created_at', { ascending: false }),
      getFallbackJson<Record<string, string>>(STATUS_OVERRIDES_KEY, {}),
    ]);

    if (error) {
      const fbContacts = await getFallbackJson<any[]>('fallback_contacts', []);
      return NextResponse.json({ contacts: Array.isArray(fbContacts) ? fbContacts : [] });
    }

    const merged = (contacts || []).map((c: any) => {
      const ovStatus = statusOverrides?.[String(c.id)];
      return ovStatus ? { ...c, status: ovStatus } : c;
    });

    return NextResponse.json({ contacts: merged });
  } catch (err: any) {
    console.error('[contacts GET]', err);
    const fbContacts = await getFallbackJson<any[]>('fallback_contacts', []);
    return NextResponse.json({ contacts: Array.isArray(fbContacts) ? fbContacts : [] });
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

    const { name, email, category, message } = body || {};
    if (!name || !email || !message) {
      return NextResponse.json({ error: '必須項目が不足しています' }, { status: 400 });
    }

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
    return NextResponse.json({ error: err?.message || '登録に失敗しました' }, { status: 500 });
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

    const { id, status, admin_note, reply_text } = body || {};

    if (!id) {
      return NextResponse.json({ error: '必須項目が不足しています' }, { status: 400 });
    }
    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: '無効なステータスです' }, { status: 400 });
    }

    const updateData: any = { updated_at: new Date().toISOString() };
    if (status) updateData.status = status;
    if (admin_note !== undefined) updateData.admin_note = admin_note;
    if (reply_text !== undefined) updateData.reply_text = reply_text;

    let { error } = await adminClient
      .from('contacts')
      .update(updateData)
      .eq('id', id);

    // If 'replied' fails DB CHECK constraint ('unread'/'in_progress'/'resolved'), retry DB update with 'resolved'
    if (error && status === 'replied') {
      const retry = await adminClient
        .from('contacts')
        .update({ ...updateData, status: 'resolved' })
        .eq('id', id);
      error = retry.error;
      if (!error) {
        const overrides = await getFallbackJson<Record<string, string>>(STATUS_OVERRIDES_KEY, {});
        overrides[String(id)] = 'replied';
        await setFallbackJson(STATUS_OVERRIDES_KEY, overrides);
      }
    } else if (!error && status && status !== 'replied') {
      const overrides = await getFallbackJson<Record<string, string>>(STATUS_OVERRIDES_KEY, {});
      if (overrides && overrides[String(id)]) {
        delete overrides[String(id)];
        await setFallbackJson(STATUS_OVERRIDES_KEY, overrides);
      }
    }

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
