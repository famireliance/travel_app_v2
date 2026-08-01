import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  // Supabaseから返ってきたエラーはトップページへリダイレクト（エラーメッセージ付き）
  if (error) {
    const redirectUrl = new URL('/', requestUrl.origin);
    redirectUrl.searchParams.set('auth_error', errorDescription || error);
    return NextResponse.redirect(redirectUrl);
  }

  // codeがある場合はPKCE認証コードをセッションに交換する（最重要ステップ）
  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    // サーバーサイドでセッションを確立するためにクッキーを使うクライアントが必要
    // ここでは簡単のためレスポンスヘッダーでクッキーをセットする
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        flowType: 'pkce',
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('Auth code exchange error:', exchangeError);
      const redirectUrl = new URL('/', requestUrl.origin);
      redirectUrl.searchParams.set('auth_error', 'メール確認に失敗しました。再度お試しください。');
      return NextResponse.redirect(redirectUrl);
    }
  }

  // 認証成功 → トップページへリダイレクト（成功フラグ付き）
  const redirectUrl = new URL('/', requestUrl.origin);
  redirectUrl.searchParams.set('auth_success', '1');
  return NextResponse.redirect(redirectUrl);
}
