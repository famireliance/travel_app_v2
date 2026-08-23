import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

export async function POST(req: NextRequest) {
  try {
    // 認証チェック
    const anonClient = createClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(
      req.headers.get('authorization')?.replace('Bearer ', '') || ''
    );
    if (authError || !user) {
      return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 });
    }

    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // プロフィール取得（サーバーサイドで二重チェック）
    const { data: profile, error: profileError } = await adminClient
      .from('user_profiles')
      .select('subscription_tier, ultimate_started_at, anniversary_cert_used')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'プロフィールの取得に失敗しました' }, { status: 500 });
    }

    // Ultimateプランか確認
    if (profile.subscription_tier !== 'ultimate') {
      return NextResponse.json({ error: 'この特典はUltimateプラン限定です' }, { status: 403 });
    }

    // 1周年特典を既に使用済みか確認
    if (profile.anniversary_cert_used) {
      return NextResponse.json({ error: '1周年記念特典は既に使用済みです' }, { status: 409 });
    }

    // 申請期間チェック（1年以上 かつ 18ヶ月以内）
    if (!profile.ultimate_started_at) {
      return NextResponse.json({ error: 'Ultimate開始日が記録されていません。しばらくお待ちください。' }, { status: 400 });
    }

    const startedAt = new Date(profile.ultimate_started_at);
    const now = new Date();
    const daysSinceStart = (now.getTime() - startedAt.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceStart < 365) {
      return NextResponse.json({ error: 'Ultimate加入から1年が経過していません' }, { status: 403 });
    }
    if (daysSinceStart > 365 + 180) {
      return NextResponse.json({ error: '申請期限（1周年から6ヶ月以内）が過ぎています' }, { status: 403 });
    }

    // リクエストボディを取得
    const body = await req.json();
    const { island_id, island_name, recipient_name, postal_code, address, phone } = body;

    if (!island_id || !island_name || !recipient_name || !postal_code || !address || !phone) {
      return NextResponse.json({ error: '必須項目が入力されていません' }, { status: 400 });
    }

    // physical_orders に INSERT
    const { error: insertError } = await adminClient
      .from('physical_orders')
      .insert({
        user_id: user.id,
        island_id,
        type: 'anniversary',
        shipping_name: recipient_name,
        shipping_postal_code: postal_code,
        shipping_address: address,
        shipping_phone: phone,
        status: 'ordered',
      });

    if (insertError) {
      console.error('Insert error:', insertError);
      return NextResponse.json({ error: '申請の保存に失敗しました' }, { status: 500 });
    }

    // anniversary_cert_used を true に更新
    const { error: updateError } = await adminClient
      .from('user_profiles')
      .update({ anniversary_cert_used: true })
      .eq('id', user.id);

    if (updateError) {
      console.error('Update error:', updateError);
      // INSERT は成功しているので警告ログのみ
    }

    return NextResponse.json({ success: true, message: '申請を受け付けました' });

  } catch (err) {
    console.error('Anniversary certificate error:', err);
    return NextResponse.json({ error: '予期しないエラーが発生しました' }, { status: 500 });
  }
}
