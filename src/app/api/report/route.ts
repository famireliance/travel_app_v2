import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: '認証ヘッダーがありません' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    
    const anonClient = createClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: '認証エラー' }, { status: 401 });
    }

    const { diary_id, reason } = await req.json();

    if (!diary_id) {
      return NextResponse.json({ error: '対象の投稿が指定されていません' }, { status: 400 });
    }

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { error: insertError } = await adminClient
      .from('reports')
      .insert([
        {
          diary_id,
          reporter_id: user.id,
          reason: reason || 'user_reported',
          status: 'pending'
        }
      ]);

    if (insertError) {
      console.error('Failed to insert report:', insertError);
      
      // テーブルが存在しない等の開発環境フォールバック
      if (insertError.message.includes('relation "reports" does not exist')) {
        console.warn('Reports table does not exist. Fallback: log to console.');
        console.log(`[REPORT] User ${user.id} reported diary ${diary_id}`);
        return NextResponse.json({ message: '通報を受理しました（開発環境ログ）' }, { status: 200 });
      }
      
      return NextResponse.json({ error: '通報の処理に失敗しました' }, { status: 500 });
    }

    return NextResponse.json({ message: '通報を受理しました' }, { status: 200 });
  } catch (error: any) {
    console.error('Report API error:', error);
    return NextResponse.json({ error: '内部サーバーエラー' }, { status: 500 });
  }
}
