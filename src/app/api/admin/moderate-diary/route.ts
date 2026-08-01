import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAdminPassword } from '@/lib/adminAuth';

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

export async function POST(req: NextRequest) {
  const adminPw = await getAdminPassword();
  const auth = req.headers.get('x-admin-password');
  if (!auth || auth !== adminPw) {
    return NextResponse.json({ error: '認証エラー' }, { status: 401 });
  }
  if (!SERVICE_ROLE_KEY || SERVICE_ROLE_KEY.startsWith('REPLACE')) {
    return NextResponse.json({ error: 'SERVICE_ROLE_KEY未設定' }, { status: 503 });
  }
  
  const { diaryId, action } = await req.json(); // action: 'hide' | 'show' | 'delete'
  const client = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  
  if (action === 'delete') {
    const { error } = await client.from('island_diaries').delete().eq('id', diaryId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, message: '日記を削除しました' });
  }
  
  const { error } = await client
    .from('island_diaries')
    .update({ is_hidden: action === 'hide' })
    .eq('id', diaryId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, message: action === 'hide' ? '日記を非表示にしました' : '日記を表示に戻しました' });
}
