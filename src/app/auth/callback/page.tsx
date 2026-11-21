'use client';

import { useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient, type EmailOtpType } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { translateAuthError } from '@/lib/authHelpers';

const VALID_OTP_TYPES = new Set<EmailOtpType>([
  'signup',
  'invite',
  'magiclink',
  'recovery',
  'email_change',
  'email',
]);

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const handledRef = useRef(false);
  const initialHashRef = useRef<string | null>(null);

  if (initialHashRef.current === null && typeof window !== 'undefined') {
    initialHashRef.current = window.location.hash.replace(/^#/, '');
  }

  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;

    const completeAuth = async () => {
      try {
        const rawHash =
          initialHashRef.current ||
          (typeof window !== 'undefined' ? window.location.hash.replace(/^#/, '') : '');
        const hashParams = new URLSearchParams(rawHash);

        const queryError = searchParams.get('error');
        const queryErrorDesc = searchParams.get('error_description');
        const hashError = hashParams.get('error') || hashParams.get('error_code');
        const hashErrorDesc = hashParams.get('error_description');

        // 1. 明示的エラー（期限切れ・使用済みリンク等）のハンドリング（クエリ＆ハッシュ双方に対応）
        if (queryError || hashError) {
          const errorMsg = queryErrorDesc || hashErrorDesc || queryError || hashError || '';
          const translated = translateAuthError(errorMsg);
          router.replace(`/?auth_error=${encodeURIComponent(translated)}`);
          return;
        }

        // 2. token_hash 方式（カスタムメールテンプレート等）の検証
        const tokenHash = searchParams.get('token_hash');
        const rawType = searchParams.get('type') as EmailOtpType | null;
        if (tokenHash && rawType && VALID_OTP_TYPES.has(rawType)) {
          const { error: otpError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: rawType,
          });
          if (!otpError) {
            router.replace('/?auth_success=1');
            return;
          }
          const { data: fallbackSession } = await supabase.auth.getSession();
          if (fallbackSession.session) {
            router.replace('/?auth_success=1');
            return;
          }
          router.replace(
            `/?auth_error=${encodeURIComponent(translateAuthError(otpError.message || ''))}`
          );
          return;
        }

        // 3. Implicit フロー（#access_token=... — メールアプリ内ブラウザや別端末でも動作）
        // GoTrueClient._initialize() による自動解析完了を getSession() で待機
        const { data: initialSessionData } = await supabase.auth.getSession();
        if (initialSessionData.session) {
          router.replace('/?auth_success=1');
          return;
        }

        const hashAccessToken = hashParams.get('access_token');
        const hashRefreshToken = hashParams.get('refresh_token');
        if (hashAccessToken && hashRefreshToken) {
          const { data: setRes, error: setErr } = await supabase.auth.setSession({
            access_token: hashAccessToken,
            refresh_token: hashRefreshToken,
          });
          if (!setErr && setRes.session) {
            router.replace('/?auth_success=1');
            return;
          }
          router.replace(
            `/?auth_error=${encodeURIComponent(
              translateAuthError(setErr?.message || 'token has expired or is invalid')
            )}`
          );
          return;
        }

        // 4. 旧PKCEフロー (?code=...) の後方互換サポート（二重消費バグを防止）
        const code = searchParams.get('code');
        if (code) {
          const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
          const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
          const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

          if (supabaseUrl && supabaseAnonKey) {
            const pkceClient = createClient(supabaseUrl, supabaseAnonKey, {
              auth: {
                flowType: 'pkce',
                detectSessionInUrl: false,
                persistSession: true,
              },
            });
            const { data: pkceData, error: pkceError } =
              await pkceClient.auth.exchangeCodeForSession(code);

            if (!pkceError && pkceData.session) {
              await supabase.auth.setSession({
                access_token: pkceData.session.access_token,
                refresh_token: pkceData.session.refresh_token,
              });
              router.replace('/?auth_success=1');
              return;
            }
          }

          // 二重実行やタイミング差で既にセッションが確立されていないか最終確認
          const { data: retrySession } = await supabase.auth.getSession();
          if (retrySession.session) {
            router.replace('/?auth_success=1');
            return;
          }

          router.replace(
            '/?auth_error=' +
              encodeURIComponent(
                '認証リンクの有効期限切れ、または別ブラウザで開かれたため確認できませんでした。もう一度マジックリンクを送信してください。'
              )
          );
          return;
        }

        router.replace('/');
      } catch (err: any) {
        console.error('Auth callback unexpected error:', err);
        router.replace(
          `/?auth_error=${encodeURIComponent(translateAuthError(err?.message || ''))}`
        );
      }
    };

    completeAuth();
  }, [router, searchParams]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8FAFC]">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-slate-600 font-bold">認証中...</p>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen">Loading...</div>}>
      <AuthCallbackContent />
    </Suspense>
  );
}
