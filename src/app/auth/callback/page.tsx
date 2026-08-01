'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (error) {
      router.replace(`/?auth_error=${encodeURIComponent(errorDescription || error)}`);
      return;
    }

    if (code) {
      // クライアント側でコードをセッションに交換
      // ※ localStorageに保存されたPKCE code verifierを使用するため、クライアントで実行必須
      supabase.auth.exchangeCodeForSession(code).then(({ error: exchangeError }) => {
        if (exchangeError) {
          console.error('Auth callback error:', exchangeError);
          router.replace('/?auth_error=メール確認に失敗しました。再度お試しください。');
        } else {
          router.replace('/?auth_success=1');
        }
      });
    } else {
      router.replace('/');
    }
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
